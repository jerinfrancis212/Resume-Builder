import { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { copyCurrentUrl, detectInAppBrowser, openInAndroidChrome } from '@/lib/inAppBrowser';

/**
 * Slim top banner shown ONLY inside Instagram / Facebook / TikTok in-app browsers.
 * Helps users jump into Chrome (Android) or Safari (iOS) for 1-tap Google Sign-In,
 * reliable Razorpay UPI payments, and PDF downloads. Completely hidden on normal browsers.
 */
export function InAppBrowserBanner() {
  const info = useMemo(() => detectInAppBrowser(), []);
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!info.isInApp || dismissed) return null;

  const handleCopy = async () => {
    const ok = await copyCurrentUrl();
    if (ok) {
      setCopied(true);
      toast.success('Link copied! Paste it into Safari or Chrome.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="sticky top-0 z-50 border-b border-primary/20 bg-primary text-primary-foreground px-3 py-2 text-xs shadow-sm">
      <div className="container flex items-center justify-between gap-2 px-0">
        <div className="flex items-center gap-2 min-w-0">
          <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-90" />
          <p className="truncate leading-snug">
            {info.platform === 'android' ? (
              <>
                For 1-tap Google login &amp; PDF download, open in <strong>Chrome</strong>.
              </>
            ) : (
              <>
                Tap <strong>•••</strong> (top right) → <strong>Open in browser</strong> for 1-tap login.
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {info.platform === 'android' ? (
            <button
              type="button"
              onClick={() => openInAndroidChrome()}
              className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm active:scale-95 transition-transform"
            >
              Open in Chrome
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-primary shadow-sm active:scale-95 transition-transform"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss browser notice"
            className="rounded p-1 opacity-80 hover:opacity-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
