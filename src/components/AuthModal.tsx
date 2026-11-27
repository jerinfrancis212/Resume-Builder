import { useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, Check, Cloud, Copy, Download, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/useAuthStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { copyCurrentUrl, detectInAppBrowser, openInAndroidChrome } from '@/lib/inAppBrowser';

const PERKS = [
  {
    icon: Download,
    title: 'Instant A4 PDF downloads',
    desc: 'Export selectable-text, ATS-friendly resumes anytime.',
  },
  {
    icon: Cloud,
    title: 'Autosaved to the cloud',
    desc: 'Your drafts sync seamlessly across desktop and mobile.',
  },
  {
    icon: ShieldCheck,
    title: 'Private & password-free',
    desc: 'One-click Google sign-in with strict account privacy.',
  },
];

export function AuthModal() {
  const { authModalOpen, authModalReason, authModalMode, closeAuthModal, signInWithGoogle } = useAuthStore();
  const isDownloadGate = authModalMode === 'download';
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inApp = useMemo(() => detectInAppBrowser(), []);

  const handleCopyLink = async () => {
    const ok = await copyCurrentUrl();
    if (ok) {
      setCopied(true);
      toast.success('Link copied! Paste it into Safari or Chrome for 1-tap Google login.');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={authModalOpen}
      onOpenChange={(open) => {
        if (!open) {
          setError(null);
          setBusy(false);
          closeAuthModal();
        }
      }}
    >
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden gap-0 border-border/80">
        {/* Top subtle editorial header */}
        <div className="relative bg-gradient-to-b from-secondary/80 via-secondary/35 to-background px-6 pt-7 pb-5 text-center border-b border-border/60">
          <img
            src="/norvel-logo.jpg"
            alt="Norvel logo"
            className="mx-auto mb-4 h-12 w-12 rounded-2xl object-cover shadow-lift ring-4 ring-primary/10"
          />

          <DialogHeader className="text-center sm:text-center space-y-1.5">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              {isDownloadGate ? 'Sign in to download your CV' : 'Welcome to Norvel'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {authModalReason || 'Continue with your Google account to save, sync, and export your resumes.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5 bg-background">
          {!isSupabaseConfigured && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                Supabase Google Auth not configured
              </p>
              <p className="leading-relaxed">
                Add <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">VITE_SUPABASE_URL</code> and{' '}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">VITE_SUPABASE_ANON_KEY</code> to{' '}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env</code>.
              </p>
            </div>
          )}

          {/* In-App Browser (Instagram / Facebook / TikTok) Breakout Guidance */}
          {inApp.isInApp && (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.05] p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  Open in {inApp.platform === 'ios' ? 'Safari' : 'Chrome'} for 1-tap Google Login
                </p>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  {inApp.appName ? `${inApp.appName}’s` : 'This'} built-in browser doesn’t share your saved Google account, so it asks for your email &amp; password manually.
                </p>
              </div>

              {inApp.platform === 'android' ? (
                <button
                  type="button"
                  onClick={() => openInAndroidChrome()}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.99] transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Chrome (No Password Needed)
                </button>
              ) : (
                <div className="space-y-2.5">
                  <ol className="space-y-1 text-[11.5px] text-foreground/90 pl-4 list-decimal">
                    <li>
                      Tap <strong>•••</strong> at the top-right corner of {inApp.appName || 'the app'}
                    </li>
                    <li>
                      Select <strong>Open in external browser</strong> (Safari)
                    </li>
                  </ol>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-background px-3 text-xs font-medium text-primary hover:bg-primary/5 active:scale-[0.99] transition-all"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Link Copied — Paste in Safari' : 'Or Copy Link to Open in Safari'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Value highlights */}
          <div className="space-y-3">
            {PERKS.map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Primary Google Sign-In CTA */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy || !isSupabaseConfigured}
            className="group relative flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-900/10 bg-slate-950 px-5 text-sm font-medium text-white shadow-soft transition-all hover:bg-slate-900 hover:shadow-lift active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                  <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
                  <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z" />
                  <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                </svg>
              </span>
            )}
            <span>{busy ? 'Redirecting to Google…' : 'Continue with Google'}</span>
            {!busy && (
              <ArrowRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:opacity-100" />
            )}
          </button>

          <p className="text-center text-[11px] text-muted-foreground">
            One-click sign-in · Your local drafts are preserved automatically
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
