import { createWorker } from 'tesseract.js';
import { getManilaTime } from './gps-utils';
import { checkDuplicateReference } from './order-store';

export interface ReceiptData {
  name: string;
  amount: number;
  referenceNumber: string;
  dateTime: string;
  rawText: string;
}

export interface VerificationResult {
  isValid: boolean;
  receiptData: ReceiptData | null;
  rejectionReason?: string;
  confidence: number;
}

// Preprocess image for better OCR accuracy - optimized for GCash receipts
async function preprocessImage(imageFile: File): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(URL.createObjectURL(imageFile));
        return;
      }
      
      // Scale up for better OCR - GCash screenshots are usually clear
      const minDimension = 2000;
      const scale = Math.max(1, minDimension / Math.min(img.width, img.height));
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      
      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Light enhancement only - don't over-process
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        
        // Gentle contrast boost - don't lose text details
        const contrast = 1.2;
        const adjusted = Math.min(255, Math.max(0, ((gray - 128) * contrast) + 128));
        
        data[i] = adjusted;
        data[i + 1] = adjusted;
        data[i + 2] = adjusted;
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      resolve(canvas.toDataURL('image/png', 1.0));
    };
    
    img.onerror = () => {
      resolve(URL.createObjectURL(imageFile));
    };
    
    img.src = URL.createObjectURL(imageFile);
  });
}

// Extract receipt data using OCR with enhanced settings
export async function extractReceiptData(imageFile: File): Promise<{ text: string; confidence: number }> {
  const worker = await createWorker('eng', 1, {
    logger: () => {} // Suppress logs
  });
  
  try {
    // Set parameters for better receipt recognition
    await worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:/+-*₱PHP() \n',
      tessedit_pageseg_mode: '6', // Assume uniform block of text
      preserve_interword_spaces: '1',
    });
    
    // Preprocess image for better accuracy
    const processedImageUrl = await preprocessImage(imageFile);
    
    const { data } = await worker.recognize(processedImageUrl);
    
    // Clean up blob URL if created
    if (processedImageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(processedImageUrl);
    }
    
    return {
      text: data.text,
      confidence: data.confidence
    };
  } finally {
    await worker.terminate();
  }
}

// Parse GCash receipt text to extract data - Enhanced for masked names
export function parseGCashReceipt(text: string): ReceiptData | null {
  try {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const fullText = lines.join(' ');
    const fullTextUpper = fullText.toUpperCase();
    
    // Extract amount - comprehensive patterns for GCash
    let amount = 0;
    const amountPatterns = [
      /(?:PHP|₱|P)\s*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /AMOUNT[:\s]*(?:PHP|₱|P)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /TOTAL[:\s]*(?:PHP|₱|P)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /SENT[:\s]*(?:PHP|₱|P)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /YOU\s*SENT[:\s]*(?:PHP|₱|P)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi,
      /([0-9,]+(?:\.[0-9]{2})?)\s*(?:PHP|PESOS?)/gi,
      /MONEY\s*SENT[:\s]*(?:PHP|₱|P)?\s*([0-9,]+(?:\.[0-9]{2})?)/gi
    ];
    
    for (const pattern of amountPatterns) {
      const matches = [...fullTextUpper.matchAll(pattern)];
      for (const match of matches) {
        const numStr = match[1]?.replace(/,/g, '') || match[0].replace(/[^0-9.]/g, '');
        const parsed = parseFloat(numStr);
        if (parsed > 0 && parsed > amount) {
          amount = parsed;
        }
      }
    }

    // Extract reference number - GCash format (typically 13 digits)
    let referenceNumber = '';
    const refPatterns = [
      /(?:REF(?:ERENCE)?\.?\s*(?:NO\.?|NUMBER|NUM)?[:\s]*)([0-9]{10,15})/gi,
      /(?:TRANSACTION\s*(?:NO\.?|NUMBER|ID)?[:\s]*)([0-9A-Z]{10,20})/gi,
      /\b([0-9]{13})\b/g,
      /\b([0-9]{12,15})\b/g
    ];
    
    for (const pattern of refPatterns) {
      const matches = [...fullText.matchAll(pattern)];
      for (const match of matches) {
        const ref = match[1] || match[0];
        if (ref && ref.length >= 10 && ref.length <= 20) {
          referenceNumber = ref.replace(/\s/g, '');
          break;
        }
      }
      if (referenceNumber) break;
    }

    // Extract name - Comprehensive patterns for GCash masked names
    let name = '';
    
    // Debug: log all lines for analysis
    console.log("[v0] OCR Lines for name extraction:", lines);
    
    // Method 1: Look for "Sent to" or "To" patterns in original text (preserve case)
    const originalLines = text.split('\n').map(line => line.trim()).filter(Boolean);
    
    for (let i = 0; i < originalLines.length; i++) {
      const line = originalLines[i];
      const lineUpper = line.toUpperCase();
      const nextLine = originalLines[i + 1] || '';
      const nextLineUpper = nextLine.toUpperCase();
      
      // Check for "Sent to" or "To" indicators
      if (lineUpper.includes('SENT TO') || lineUpper.includes('TO:') || 
          lineUpper === 'TO' || lineUpper.includes('RECEIVER')) {
        
        // Try to extract from same line first
        // GCash format: "Sent to JO***AL C." or "To: MA***A R."
        const sameLineMatch = line.match(/(?:Sent\s*to|To:|Receiver)[:\s]*([A-Za-z][A-Za-z*]+[A-Za-z*]*\s+[A-Za-z]\.?)/i);
        if (sameLineMatch && sameLineMatch[1]) {
          name = sameLineMatch[1].trim().toUpperCase();
          console.log("[v0] Found name on same line:", name);
          break;
        }
        
        // Check if name is on the next line
        if (nextLine && nextLine.length >= 4) {
          // Skip if it's a label or number
          const skipWords = ['AMOUNT', 'REF', 'DATE', 'PHP', 'TRANSACTION', 'MOBILE', 'NUMBER', 'TOTAL'];
          const isLabel = skipWords.some(w => nextLineUpper.includes(w));
          
          if (!isLabel && /^[A-Za-z*]/.test(nextLine)) {
            // This is likely the name
            // Extract name pattern: letters, asterisks, space, single letter with optional period
            const nameMatch = nextLine.match(/^([A-Za-z][A-Za-z*\s]*[A-Za-z*]+\s+[A-Za-z]\.?)/);
            if (nameMatch) {
              name = nameMatch[1].trim().toUpperCase();
              console.log("[v0] Found name on next line:", name);
              break;
            } else {
              // Take the whole line if it looks like a name
              const cleaned = nextLine.split(/\s{2,}/)[0].trim();
              if (cleaned.length >= 4 && /[A-Za-z]/.test(cleaned)) {
                name = cleaned.toUpperCase();
                console.log("[v0] Found name (full next line):", name);
                break;
              }
            }
          }
        }
      }
    }
    
    // Method 2: Search for masked name patterns (A***O C. format) anywhere
    if (!name || name.length < 4) {
      // Patterns for GCash masked names
      const maskedPatterns = [
        // JO***AL C. or MA***A R. format
        /([A-Z]{2,}[*]+[A-Z]{1,3}\s+[A-Z]\.?)/g,
        // A***O C. format
        /([A-Z][*]{2,}[A-Z]\s+[A-Z]\.?)/g,
        // CHRIS***L A. format (longer names)
        /([A-Z]{3,}[*]+[A-Z]+\s+[A-Z]\.?)/g,
        // Any pattern with asterisks followed by space and initial
        /([A-Z]+[*]+[A-Z]+\s+[A-Z]\.?)/g,
      ];
      
      for (const pattern of maskedPatterns) {
        const matches = fullTextUpper.match(pattern);
        if (matches && matches.length > 0) {
          // Get the best match (longest and most complete)
          const validMatches = matches.filter(m => m.length >= 5 && m.includes('*'));
          if (validMatches.length > 0) {
            name = validMatches.reduce((a, b) => a.length > b.length ? a : b);
            console.log("[v0] Found masked name pattern:", name);
            break;
          }
        }
      }
    }
    
    // Method 3: Look for any name-like pattern after "to" keyword
    if (!name || name.length < 4) {
      const toMatch = fullTextUpper.match(/(?:SENT\s*TO|TO)[:\s]+([A-Z][A-Z*\s.]{3,})/i);
      if (toMatch && toMatch[1]) {
        // Clean and validate
        let extracted = toMatch[1].trim();
        // Remove anything after common labels
        extracted = extracted.split(/\s+(AMOUNT|REF|PHP|DATE|MOBILE)/i)[0].trim();
        if (extracted.length >= 4) {
          name = extracted;
          console.log("[v0] Found name via 'to' keyword:", name);
        }
      }
    }
    
    // Final cleanup
    if (name) {
      // Remove leading/trailing labels
      name = name.replace(/^(SENT\s*TO|TO|RECEIVER|RECIPIENT)[:\s]*/i, '').trim();
      name = name.replace(/\s+(PHP|AMOUNT|REF|DATE|\d{3,}).*$/i, '').trim();
      // Remove trailing periods if doubled
      name = name.replace(/\.+$/, '.').trim();
      
      // Validate final name
      if (name.length < 4 || !/[A-Z]/.test(name)) {
        console.log("[v0] Name validation failed, resetting:", name);
        name = '';
      }
    }
    
    console.log("[v0] Final extracted name:", name);

    // Extract date and time
    let dateTime = '';
    const datePatterns = [
      // MM/DD/YYYY HH:MM AM/PM
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\s*[,\s]*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/gi,
      // Month DD, YYYY HH:MM
      /([A-Z]{3,9}\s+\d{1,2},?\s+\d{4})\s*[,\s]*(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)/gi,
      // YYYY-MM-DD HH:MM
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\s*[,\s]*(\d{1,2}:\d{2}(?::\d{2})?)/gi,
      // Just date
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
      // Month DD, YYYY
      /([A-Z]{3,9}\s+\d{1,2},?\s+\d{4})/gi
    ];
    
    for (const pattern of datePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        dateTime = match[0].trim();
        break;
      }
    }

    // Validate we have minimum required data
    if (!referenceNumber && amount === 0) {
      return null;
    }

    return {
      name: name || 'Unknown',
      amount,
      referenceNumber,
      dateTime,
      rawText: text
    };
  } catch (error) {
    console.error('[v0] Error parsing receipt:', error);
    return null;
  }
}

// Verify receipt validity with comprehensive checks
export async function verifyReceipt(
  receiptData: ReceiptData,
  expectedAmount: number
): Promise<VerificationResult> {
  const rejectionReasons: string[] = [];
  
  // Check 1: Amount verification (must match exactly or within ₱1 tolerance)
  const amountTolerance = 1;
  if (receiptData.amount === 0) {
    rejectionReasons.push('Unable to detect payment amount from receipt');
  } else if (Math.abs(receiptData.amount - expectedAmount) > amountTolerance) {
    rejectionReasons.push(
      `Amount mismatch: Receipt shows ₱${receiptData.amount.toFixed(2)} but order total is ₱${expectedAmount.toFixed(2)}. Please send the exact amount.`
    );
  }

  // Check 2: Reference number validation
  if (!receiptData.referenceNumber) {
    rejectionReasons.push('Missing reference number - please upload a complete GCash receipt');
  } else if (receiptData.referenceNumber.length < 10) {
    rejectionReasons.push('Invalid reference number format');
  }

  // Check 3: Duplicate reference number check (anti-reuse)
  if (receiptData.referenceNumber) {
    const isDuplicate = await checkDuplicateReference(receiptData.referenceNumber);
    if (isDuplicate) {
      rejectionReasons.push('This receipt has already been used. Each receipt can only be used once.');
    }
  }

  // Check 4: Date/Time validation - must be within 24 hours
  if (receiptData.dateTime) {
    const receiptDate = parseReceiptDate(receiptData.dateTime);
    if (receiptDate) {
      const manilaTime = getManilaTime();
      const hoursDiff = (manilaTime.getTime() - receiptDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 24) {
        rejectionReasons.push(
          `Receipt is expired. Payment was made ${Math.floor(hoursDiff)} hours ago. Only receipts within 24 hours are accepted.`
        );
      }
      
      if (hoursDiff < -1) { // Allow 1 hour tolerance for timezone issues
        rejectionReasons.push('Invalid receipt date - appears to be from the future. Possible tampering detected.');
      }
    }
  }

  // Check 5: GCash specific validation
  const rawTextUpper = receiptData.rawText.toUpperCase();
  const gcashIndicators = [
    'GCASH', 'G-CASH', 'GLOBE', 'SEND MONEY', 'MONEY SENT', 
    'YOU SENT', 'SENT TO', 'TRANSACTION', 'SUCCESSFUL'
  ];
  const hasGcashIndicator = gcashIndicators.some(indicator => rawTextUpper.includes(indicator));
    
  if (!hasGcashIndicator) {
    rejectionReasons.push('This does not appear to be a valid GCash payment receipt');
  }

  // Check 6: Image manipulation/fraud detection
  const suspiciousPatterns = [
    'EDITED', 'PHOTOSHOP', 'MODIFIED', 'SAMPLE', 'TEST', 
    'FAKE', 'DEMO', 'TEMPLATE', 'SCREENSHOT EDIT', 'CANVA'
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (rawTextUpper.includes(pattern)) {
      rejectionReasons.push(`Fraudulent receipt detected: "${pattern}" found. This order has been flagged.`);
      break;
    }
  }

  // Check 7: Verify name exists (masked or full)
  if (!receiptData.name || receiptData.name === 'Unknown') {
    // This is a warning, not a rejection - some receipts may not show name clearly
    console.warn('[v0] Could not extract sender name from receipt');
  }

  return {
    isValid: rejectionReasons.length === 0,
    receiptData,
    rejectionReason: rejectionReasons.join(' | '),
    confidence: rejectionReasons.length === 0 ? 95 : 0
  };
}

// Parse receipt date string to Date object
function parseReceiptDate(dateStr: string): Date | null {
  try {
    // Clean up the date string
    const cleaned = dateStr.trim().toUpperCase();
    
    // Try various date formats
    const formats = [
      // MM/DD/YYYY HH:MM AM/PM
      /(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i,
      // MM-DD-YYYY HH:MM
      /(\d{1,2})-(\d{1,2})-(\d{4})\s*(\d{1,2}):(\d{2})/i,
      // YYYY-MM-DD HH:MM
      /(\d{4})-(\d{1,2})-(\d{1,2})\s*(\d{1,2}):(\d{2})/,
    ];

    for (const format of formats) {
      const match = cleaned.match(format);
      if (match) {
        // Parse based on format
        let year: number, month: number, day: number, hour = 0, minute = 0;
        
        if (format.source.startsWith('(\\d{4})')) {
          // YYYY-MM-DD format
          year = parseInt(match[1]);
          month = parseInt(match[2]) - 1;
          day = parseInt(match[3]);
          hour = parseInt(match[4]) || 0;
          minute = parseInt(match[5]) || 0;
        } else {
          // MM/DD/YYYY or MM-DD-YYYY format
          month = parseInt(match[1]) - 1;
          day = parseInt(match[2]);
          year = parseInt(match[3]);
          hour = parseInt(match[4]) || 0;
          minute = parseInt(match[5]) || 0;
          
          // Handle AM/PM
          if (match[7]) {
            if (match[7] === 'PM' && hour < 12) hour += 12;
            if (match[7] === 'AM' && hour === 12) hour = 0;
          }
        }
        
        return new Date(year, month, day, hour, minute);
      }
    }

    // Try month name formats
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthNameMatch = cleaned.match(/([A-Z]{3,9})\s+(\d{1,2}),?\s+(\d{4})\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    
    if (monthNameMatch) {
      const monthStr = monthNameMatch[1].substring(0, 3);
      const monthIndex = monthNames.indexOf(monthStr);
      if (monthIndex >= 0) {
        const day = parseInt(monthNameMatch[2]);
        const year = parseInt(monthNameMatch[3]);
        let hour = parseInt(monthNameMatch[4]) || 0;
        const minute = parseInt(monthNameMatch[5]) || 0;
        
        if (monthNameMatch[6]) {
          if (monthNameMatch[6].toUpperCase() === 'PM' && hour < 12) hour += 12;
          if (monthNameMatch[6].toUpperCase() === 'AM' && hour === 12) hour = 0;
        }
        
        return new Date(year, monthIndex, day, hour, minute);
      }
    }

    // Fallback: try native parsing
    const fallback = new Date(dateStr);
    if (!isNaN(fallback.getTime())) {
      return fallback;
    }

    return null;
  } catch {
    return null;
  }
}

// Validate image file
export function validateReceiptImage(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, or WebP)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'Image file is too large. Maximum size is 10MB.' };
  }
  
  if (file.size < 1000) { // Less than 1KB is suspicious
    return { valid: false, error: 'Image file is too small. Please upload a clear screenshot.' };
  }
  
  return { valid: true };
}
