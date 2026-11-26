import { supabase } from '@/lib/supabase/client';

export type AnalyticsEventName =
  | 'resume_created'
  | 'resume_previewed'
  | 'download_clicked'
  | 'google_login_completed'
  | 'payment_modal_opened'
  | 'razorpay_checkout_initiated'
  | 'payment_successful'
  | 'payment_failed'
  | 'pdf_downloaded';

/** Non-blocking funnel & payment analytics logger backed by public.analytics_events. */
export async function trackEvent(
  eventName: AnalyticsEventName,
  opts?: { userId?: string | null; resumeId?: string | null; metadata?: Record<string, unknown> },
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('analytics_events').insert({
      user_id: opts?.userId ?? null,
      resume_id: opts?.resumeId ?? null,
      event_name: eventName,
      metadata: opts?.metadata ?? {},
    });
  } catch {
    // Analytics must never interrupt the user journey
  }
}
