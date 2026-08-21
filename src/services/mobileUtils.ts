/**
 * Cross-platform iOS & Android mobile device detection and native capabilities
 */

export interface MobilePlatformInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  hasNativeShare: boolean;
  hasVibration: boolean;
  hasGeolocation: boolean;
}

export function getMobilePlatformInfo(): MobilePlatformInfo {
  if (typeof window === 'undefined') {
    return {
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isStandalone: false,
      hasNativeShare: false,
      hasVibration: false,
      hasGeolocation: false,
    };
  }

  const userAgent = navigator.userAgent || '';
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobi|Tablet|Mobile/.test(userAgent);

  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  const hasNativeShare = 'share' in navigator;
  const hasVibration = 'vibrate' in navigator;
  const hasGeolocation = 'geolocation' in navigator;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isStandalone,
    hasNativeShare,
    hasVibration,
    hasGeolocation,
  };
}

/**
 * Trigger mobile haptic vibration feedback (supported on Android and iOS where enabled)
 */
export function triggerHapticFeedback(pattern: number | number[] = 20) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }
}

/**
 * Native iOS & Android share payload for WhatsApp, SMS, or system share sheet
 */
export async function shareFloodInfo(title: string, text: string, url: string = window.location.href): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      });
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Native share error:', err);
      }
    }
  }

  // Fallback to clipboard copy or WhatsApp web link
  try {
    const shareText = `${title}\n${text}\n${url}`;
    await navigator.clipboard.writeText(shareText);
    alert('Copied alert details to clipboard! You can paste and share via WhatsApp or SMS.');
    return true;
  } catch (e) {
    return false;
  }
}
