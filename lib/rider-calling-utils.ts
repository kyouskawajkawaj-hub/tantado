// Rider Auto-Call System
// Automatically initiates phone call when rider is within specified distance

import { Coordinates } from './gps-utils';
import { haversineDistance } from './maps-utils';

export interface RiderCallConfig {
  callDistance: number; // in km, typically 0.3km (300m)
  maxCallRetries: number;
  callTimeout: number; // in seconds
  enableNotifications: boolean;
}

export interface CallState {
  isCallActive: boolean;
  callAttempts: number;
  lastCallTime?: Date;
  callDuration?: number; // in seconds
}

const DEFAULT_CONFIG: RiderCallConfig = {
  callDistance: 0.3, // 300 meters
  maxCallRetries: 3,
  callTimeout: 60,
  enableNotifications: true
};

let callState: CallState = {
  isCallActive: false,
  callAttempts: 0
};

/**
 * Request permissions for making calls (iOS/Android)
 */
export async function requestCallPermission(): Promise<boolean> {
  try {
    // For web, we'll use the tel: protocol
    // For PWA/WebView, we can request call permissions
    if ('permissions' in navigator) {
      const permission = await (navigator as any).permissions.query({
        name: 'phone-call'
      }).catch(() => ({ state: 'granted' })); // Graceful fallback

      return permission.state !== 'denied';
    }
    return true;
  } catch (error) {
    console.warn('[Rider Call] Permission request failed:', error);
    return true; // Fallback to true for web
  }
}

/**
 * Request microphone permission for call quality check
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('[Rider Call] Microphone API not supported');
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    console.warn('[Rider Call] Microphone permission denied:', error);
    return false;
  }
}

/**
 * Initiate phone call to customer
 */
export async function initiateCall(
  phoneNumber: string,
  config: Partial<RiderCallConfig> = {}
): Promise<{ success: boolean; error?: string }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    // Validate phone number
    if (!phoneNumber || phoneNumber.trim().length < 7) {
      return { success: false, error: 'Invalid phone number' };
    }

    // Check if already in a call
    if (callState.isCallActive) {
      return { success: false, error: 'Call already in progress' };
    }

    // Check retry limit
    if (callState.callAttempts >= finalConfig.maxCallRetries) {
      return {
        success: false,
        error: `Maximum call attempts reached (${finalConfig.maxCallRetries})`
      };
    }

    // Format phone number for tel: protocol
    const formattedNumber = formatPhoneNumber(phoneNumber);

    // Initiate call using tel: protocol
    const callStarted = attemptCall(formattedNumber);

    if (callStarted) {
      // Update call state
      callState.isCallActive = true;
      callState.callAttempts += 1;
      callState.lastCallTime = new Date();

      // Show notification
      if (finalConfig.enableNotifications) {
        showCallNotification(phoneNumber);
      }

      // Set timeout to mark call as inactive
      setTimeout(() => {
        callState.isCallActive = false;
      }, finalConfig.callTimeout * 1000);

      return { success: true };
    } else {
      return { success: false, error: 'Failed to initiate call' };
    }
  } catch (error) {
    console.error('[Rider Call] Error initiating call:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Attempt to make call using tel: protocol
 */
function attemptCall(phoneNumber: string): boolean {
  try {
    // Create tel: link
    const telLink = `tel:${phoneNumber}`;

    // For mobile browsers
    if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
      navigator.userAgent.toLowerCase()
    )) {
      window.location.href = telLink;
      return true;
    } else {
      // Desktop - try to open with default dialer
      window.open(telLink, '_self');
      return true;
    }
  } catch (error) {
    console.error('[Rider Call] Failed to create tel link:', error);
    return false;
  }
}

/**
 * Format phone number for calling
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove non-numeric characters except leading +
  let formatted = phoneNumber.replace(/\D/g, '');

  // Add country code if not present (assume Philippines +63)
  if (!formatted.startsWith('63')) {
    if (formatted.startsWith('0')) {
      formatted = '63' + formatted.substring(1);
    } else if (!formatted.startsWith('63')) {
      formatted = '63' + formatted;
    }
  }

  return formatted;
}

/**
 * Show call notification to user
 */
function showCallNotification(phoneNumber: string): void {
  try {
    // Try using Notification API if available
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Rider Calling', {
          body: `Your rider is calling you at ${formatPhoneNumberForDisplay(
            phoneNumber
          )}`,
          icon: '/icon.svg',
          tag: 'rider-call',
          requireInteraction: false
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Rider Calling', {
              body: `Your rider is calling you at ${formatPhoneNumberForDisplay(
                phoneNumber
              )}`,
              icon: '/icon.svg',
              tag: 'rider-call'
            });
          }
        });
      }
    }
  } catch (error) {
    console.warn('[Rider Call] Notification failed:', error);
  }
}

/**
 * Format phone number for display
 */
function formatPhoneNumberForDisplay(phoneNumber: string): string {
  // e.g., 09XX-XXX-XXXX or +63-9XX-XXX-XXXX
  let cleaned = phoneNumber.replace(/\D/g, '');

  if (cleaned.startsWith('63')) {
    // International format
    cleaned = '+' + cleaned.substring(0, 2) + '-' + cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    // Local format
    cleaned = '0' + cleaned.substring(1);
  }

  // Format as XXX-XXX-XXXX
  if (cleaned.length === 11) {
    return cleaned.substring(0, 4) + '-' + cleaned.substring(4, 7) + '-' + cleaned.substring(7);
  }

  return phoneNumber;
}

/**
 * Monitor rider distance and auto-call when within threshold
 */
export async function monitorRiderDistance(
  getRiderCoords: () => Promise<Coordinates>,
  customerCoords: Coordinates,
  customerPhone: string,
  config: Partial<RiderCallConfig> = {}
): Promise<{ unwatch: () => void }> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  let watchInterval: NodeJS.Timeout | null = null;
  let hasCalledAtThreshold = false;

  const startMonitoring = async () => {
    watchInterval = setInterval(async () => {
      try {
        const riderCoords = await getRiderCoords();
        const distance = haversineDistance(riderCoords, customerCoords);

        // Auto-call when within threshold and not already called
        if (distance <= finalConfig.callDistance && !hasCalledAtThreshold) {
          console.log(
            `[Rider Call] Rider is ${(distance * 1000).toFixed(0)}m away, initiating call`
          );

          const result = await initiateCall(customerPhone, config);
          if (result.success) {
            hasCalledAtThreshold = true;

            // Show modal/popup
            showRiderApproachingModal(
              distance,
              formatPhoneNumberForDisplay(customerPhone)
            );
          }
        }

        // Reset after rider has moved away
        if (distance > finalConfig.callDistance * 1.5) {
          hasCalledAtThreshold = false;
        }
      } catch (error) {
        console.error('[Rider Call] Error monitoring distance:', error);
      }
    }, 5000); // Check every 5 seconds
  };

  // Start monitoring immediately
  await startMonitoring();

  return {
    unwatch: () => {
      if (watchInterval) {
        clearInterval(watchInterval);
        watchInterval = null;
      }
    }
  };
}

/**
 * Show modal indicating rider is approaching
 */
function showRiderApproachingModal(distanceKm: number, phoneNumber: string): void {
  try {
    const distanceM = Math.round(distanceKm * 1000);
    const message =
      distanceM < 100
        ? 'Your rider is here! 🎉'
        : distanceM < 300
          ? 'Your rider is arriving soon...'
          : 'Your rider is nearby! 📍';

    // Emit custom event that the component can listen to
    window.dispatchEvent(
      new CustomEvent('riderApproaching', {
        detail: {
          distance: distanceKm,
          distanceMeters: distanceM,
          phoneNumber,
          message
        }
      })
    );
  } catch (error) {
    console.error('[Rider Call] Error showing modal:', error);
  }
}

/**
 * Send SMS reminder if call fails
 */
export async function sendSMSReminder(
  phoneNumber: string,
  message: string = 'Your rider is arriving soon!'
): Promise<{ success: boolean; error?: string }> {
  try {
    // This would typically call your backend API
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, message })
    });

    if (!response.ok) {
      throw new Error('SMS send failed');
    }

    return { success: true };
  } catch (error) {
    console.error('[Rider Call] SMS send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'SMS send failed'
    };
  }
}

/**
 * Get current call state
 */
export function getCallState(): CallState {
  return { ...callState };
}

/**
 * Reset call state (for testing or manual reset)
 */
export function resetCallState(): void {
  callState = {
    isCallActive: false,
    callAttempts: 0
  };
}

/**
 * Check if device supports calling
 */
export function canMakeCall(): boolean {
  // Check for tel: protocol support (works on most modern devices)
  return true; // tel: is widely supported
}
