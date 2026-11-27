import { useEffect, useState } from 'react';
import { AlertCircle, Check, Lock, Loader2, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import type { ResumeDocument } from '@/types/resume';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DISCOUNT_PERCENT,
  OFFER_PRICE_INR,
  ORIGINAL_PRICE_INR,
  createRazorpayOrder,
  loadRazorpayScript,
  reportRazorpayFailure,
  verifyRazorpayPayment,
} from '@/lib/payments/razorpay';
import { trackEvent } from '@/lib/analytics';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';

const BENEFITS = [
  'High-quality PDF download',
  'Professional formatting',
  'A4 page layout',
  'Ready-to-share resume',
  'Free re-downloads of this version anytime (no edits)',
];

interface PaymentModalProps {
  resume: ResumeDocument | null;
  onClose: () => void;
  /** Called strictly after server-side payment verification succeeds. */
  onUnlocked: (resume: ResumeDocument) => void;
}

export function PaymentModal({ resume, onClose, onUnlocked }: PaymentModalProps) {
  const user = useAuthStore((s) => s.user);
  const markResumePaid = useResumeStore((s) => s.markResumePaid);
  const [stage, setStage] = useState<'idle' | 'creating' | 'checkout' | 'verifying'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resume) {
      setStage('idle');
      setError(null);
      void trackEvent('payment_modal_opened', { userId: user?.id, resumeId: resume.id });
    }
  }, [resume, user?.id]);

  const handlePay = async () => {
    if (!resume || !user) return;
    setError(null);
    setStage('creating');

    try {
      const [order] = await Promise.all([createRazorpayOrder(resume.id), loadRazorpayScript()]);

      // Server confirmed this resume is already purchased — never charge twice!
      if (order.alreadyPaid) {
        markResumePaid(resume.id);
        toast.success('This resume is already unlocked! Starting your PDF download.');
        onUnlocked(resume);
        onClose();
        return;
      }

      if (!order.orderId || !order.keyId || !order.amount || !order.currency) {
        throw new Error('Incomplete Razorpay order response from server.');
      }

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay Checkout failed to initialize. Please refresh and try again.');
      }

      void trackEvent('razorpay_checkout_initiated', {
        userId: user.id,
        resumeId: resume.id,
        metadata: { orderId: order.orderId, amount: order.amount },
      });

      setStage('checkout');
      let settled = false;

      const rzp = new RazorpayCtor({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Norvel',
        description: `PDF Download — ${order.resumeName || resume.name}`,
        order_id: order.orderId,
        prefill: {
          name: resume.data.personal.fullName || (user.user_metadata?.full_name as string | undefined) || '',
          email: user.email || resume.data.personal.email || '',
          contact: resume.data.personal.phone || '',
        },
        notes: {
          user_id: user.id,
          resume_id: resume.id,
        },
        theme: { color: '#1e3a5f' },
        modal: {
          ondismiss: () => {
            if (!settled) {
              setStage('idle');
              setError('Checkout was cancelled. No amount was charged — you can retry whenever you are ready.');
            }
          },
        },
        handler: async (response) => {
          settled = true;
          setStage('verifying');
          setError(null);
          try {
            const verification = await verifyRazorpayPayment({
              resumeId: resume.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (!verification.verified) {
              throw new Error('Payment could not be verified yet. Please check your dashboard shortly.');
            }

            markResumePaid(resume.id);
            toast.success('Payment Successful! Your resume is ready to download.');
            onUnlocked({ ...resume, isPaid: true });
            onClose();
          } catch (verifyErr) {
            setStage('idle');
            setError(
              verifyErr instanceof Error
                ? verifyErr.message
                : 'Payment verification failed. If money was deducted, your dashboard will unlock automatically once confirmed.',
            );
          }
        },
      });

      rzp.on('payment.failed', (failure) => {
        settled = true;
        const reason = failure.error?.description || failure.error?.reason || 'Payment failed';
        setStage('idle');
        setError(`Payment failed: ${reason}. Please try again or use another payment method.`);
        void trackEvent('payment_failed', {
          userId: user.id,
          resumeId: resume.id,
          metadata: { orderId: order.orderId, reason },
        });
        void reportRazorpayFailure({
          resumeId: resume.id,
          razorpay_order_id: order.orderId!,
          razorpay_payment_id: failure.error?.metadata?.payment_id,
          reason,
        }).catch(() => {});
      });

      // Let Radix Dialog release body pointer-events & focus-trap before opening Razorpay Checkout
      setTimeout(() => {
        document.body.style.pointerEvents = '';
        rzp.open();
      }, 60);
    } catch (err) {
      setStage('idle');
      setError(err instanceof Error ? err.message : 'Unable to start payment. Please try again.');
    }
  };

  const busy = stage !== 'idle';

  // Hide the Radix Dialog while Razorpay Checkout is open so Radix's focus-trap
  // and `pointer-events: none` on <body> never block clicks/typing inside Razorpay's iframe.
  const dialogOpen = resume !== null && stage !== 'checkout';

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden gap-0 border-border/80">
        {/* Header */}
        <div className="bg-gradient-to-b from-primary/[0.06] via-secondary/40 to-background px-6 pt-7 pb-5 text-center border-b border-border/60">
          <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-semibold text-emerald-700">
            <Sparkles className="h-3.5 w-3.5" />
            {DISCOUNT_PERCENT}% OFF – Limited Time Offer
          </div>
          <DialogHeader className="text-center sm:text-center space-y-1.5">
            <DialogTitle className="text-xl font-semibold tracking-tight text-foreground">
              Your Professional Resume Is Ready!
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Download your professionally designed resume and start applying for jobs.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Pricing + Benefits */}
        <div className="px-6 py-6 space-y-5 bg-background">
          {/* Pricing Card */}
          <div className="rounded-xl border border-primary/20 bg-secondary/40 px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Download your Resume</p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate max-w-[200px]">
                {(resume?.name || 'Your Resume').replace(/\s*\(Sample\)\s*$/i, '')}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-2">
                <span className="text-base text-muted-foreground line-through">₹{ORIGINAL_PRICE_INR}</span>
                <span className="text-3xl font-bold tracking-tight text-foreground">₹{OFFER_PRICE_INR}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">{DISCOUNT_PERCENT}% OFF</span>
            </div>
          </div>

          {/* Benefits */}
          <ul className="space-y-2.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2.5 text-sm text-foreground/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="h-3 w-3 stroke-[2.5]" />
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-3 pt-1">
            <Button
              type="button"
              size="lg"
              className="w-full h-12 text-sm font-semibold shadow-soft"
              onClick={handlePay}
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {stage === 'creating'
                    ? 'Preparing secure checkout…'
                    : stage === 'verifying'
                      ? 'Verifying payment…'
                      : 'Complete payment in Razorpay…'}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Pay ₹{OFFER_PRICE_INR} & Download PDF
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Secure payment powered by Razorpay · UPI, Cards & Net Banking</span>
            </div>
            <p className="text-center text-[10.5px] text-muted-foreground/80">
              Re-download this exact version for free anytime. Editing your resume later requires a new ₹49 download unlock.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
