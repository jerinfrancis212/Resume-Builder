export interface InAppBrowserInfo {
  isInApp: boolean;
  appName: string | null;
  platform: 'android' | 'ios' | 'other';
}

/**
 * Detects restricted embedded WebViews (Instagram, Facebook, TikTok, Snapchat, LinkedIn, etc.)
 * where Google OAuth cannot reuse the user's Safari/Chrome session and PDF downloads/UPI can fail.
 */
export function detectInAppBrowser(ua?: string): InAppBrowserInfo {
  const agent = ua ?? (typeof navigator !== 'undefined' ? navigator.userAgent || '' : '');
  const platform: InAppBrowserInfo['platform'] = /Android/i.test(agent)
    ? 'android'
    : /iPhone|iPad|iPod/i.test(agent)
      ? 'ios'
      : 'other';

  const patterns: [RegExp, string][] = [
    [/Instagram/i, 'Instagram'],
    [/FBAN|FBAV|FB_IAB/i, 'Facebook'],
    [/BytedanceWebview|musical_ly|TikTok/i, 'TikTok'],
    [/Snapchat/i, 'Snapchat'],
    [/LinkedInApp/i, 'LinkedIn'],
    [/Line\//i, 'LINE'],
    [/Twitter/i, 'X'],
  ];

  for (const [re, name] of patterns) {
    if (re.test(agent)) {
      return { isInApp: true, appName: name, platform };
    }
  }

  // Generic Android WebView (`wv` token)
  if (platform === 'android' && /\bwv\b/i.test(agent)) {
    return { isInApp: true, appName: 'in-app', platform };
  }

  return { isInApp: false, appName: null, platform };
}

/**
 * Opens the current page in Android's native Chrome browser using an Android intent URI.
 * Falls back to the standard HTTPS URL if Chrome is not installed.
 */
export function openInAndroidChrome(targetUrl?: string): void {
  if (typeof window === 'undefined') return;
  const url = targetUrl || window.location.href;
  const withoutProtocol = url.replace(/^https?:\/\//i, '');
  const scheme = url.startsWith('http://') ? 'http' : 'https';
  const fallback = encodeURIComponent(url);
  const intentUrl = `intent://${withoutProtocol}#Intent;scheme=${scheme};package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
  window.location.href = intentUrl;
}

/** Copies the current URL cleanly, including a fallback for WebViews without Clipboard API. */
export async function copyCurrentUrl(targetUrl?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const url = targetUrl || window.location.href;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // Fallback below
  }
  try {
    const el = document.createElement('textarea');
    el.value = url;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  } catch {
    return false;
  }
}
