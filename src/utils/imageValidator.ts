import * as fs from 'fs';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Validate if image path exists and has valid extension
 * @param imagePath Path to the image file
 * @returns True if valid, false otherwise
 */
export function validateImagePath(imagePath: string): boolean {
  if (!fs.existsSync(imagePath)) {
    console.error(`File not found: ${imagePath}`);
    return false;
  }

  const ext = imagePath.toLowerCase().substring(imagePath.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    console.error(`Invalid file extension: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    return false;
  }

  const stats = fs.statSync(imagePath);
  if (stats.size > MAX_FILE_SIZE) {
    console.error(`File too large: ${stats.size} bytes. Max: ${MAX_FILE_SIZE} bytes`);
    return false;
  }

  return true;
}

/**
 * Validate image URL
 * @param imageUrl URL to validate
 * @returns True if valid URL format
 */
export function validateImageUrl(imageUrl: string): boolean {
  try {
    const url = new URL(imageUrl);
    const ext = url.pathname.toLowerCase().substring(url.pathname.lastIndexOf('.'));
    
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      console.warn(`URL doesn't have recognized image extension: ${ext}`);
      // Don't fail - URL might still be valid
    }
    
    return true;
  } catch (error) {
    console.error(`Invalid URL: ${imageUrl}`);
    return false;
  }
}

/**
 * Get image dimensions (requires image library)
 * @param imagePath Path to image
 * @returns Object with width and height
 */
export async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number } | null> {
  try {
    // This is a placeholder - install 'image-size' package for full functionality
    // const sizeOf = require('image-size');
    // const dimensions = sizeOf(imagePath);
    // return dimensions;
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}
