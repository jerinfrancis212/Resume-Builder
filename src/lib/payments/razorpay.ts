import type { PaymentRecord, PaymentStatus } from '@/types/resume';
import { supabase } from '@/lib/supabase/client';

export const ORIGINAL_PRICE_INR = 99;
export const OFFER_PRICE_INR = 49;
export const DISCOUNT_PERCENT = 51;

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (resp: { error?: { description?: string; reason?: string; metadata?: { payment_id?: string } } }) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Lazily loads the official Razorpay Checkout SDK once. */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window !== 'undefined' && window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay Checkout')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Razorpay Checkout. Check your internet connection.'));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error('Please sign in with Google to continue.');
  return token;
}

async function authedJsonFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  const resp = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const text = await resp.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    throw new Error(
      resp.status === 404
        ? 'Payment API endpoint not reachable. Run via Vercel (`vercel dev`) or deploy to Vercel with Razorpay keys configured.'
        : `Unexpected server response (${resp.status})`,
    );
  }
  if (!resp.ok) {
    throw new Error(typeof parsed.error === 'string' ? parsed.error : `Request failed (${resp.status})`);
  }
  return parsed as T;
}

export interface CreateOrderResult {
  alreadyPaid: boolean;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  resumeName?: string;
}

export function createRazorpayOrder(resumeId: string): Promise<CreateOrderResult> {
  return authedJsonFetch<CreateOrderResult>('/api/razorpay/create-order', {
    method: 'POST',
    body: JSON.stringify({ resumeId }),
  });
}

export function verifyRazorpayPayment(payload: {
  resumeId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ verified: boolean; alreadyVerified?: boolean }> {
  return authedJsonFetch('/api/razorpay/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ action: 'verify', ...payload }),
  });
}

export function reportRazorpayFailure(payload: {
  resumeId: string;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  reason?: string;
}): Promise<{ recorded: boolean }> {
  return authedJsonFetch('/api/razorpay/verify-payment', {
    method: 'POST',
    body: JSON.stringify({ action: 'mark_failed', ...payload }),
  });
}

/**
 * Checks server-verified entitlement for a resume.
 * Queries the backend API first; if running in local Vite dev without `/api`,
 * falls back to reading the RLS-protected `resumes.is_paid` directly from Supabase.
 */
export async function checkResumeEntitlement(
  resumeId: string,
): Promise<{ isPaid: boolean; paidAt: string | null; latestPaymentStatus: PaymentStatus | null }> {
  try {
    return await authedJsonFetch(`/api/razorpay/entitlement?resumeId=${encodeURIComponent(resumeId)}`, {
      method: 'GET',
    });
  } catch {
    if (!supabase) return { isPaid: false, paidAt: null, latestPaymentStatus: null };
    const { data: res } = await supabase
      .from('resumes')
      .select('is_paid, paid_at')
      .eq('id', resumeId)
      .maybeSingle();
    const { data: pay } = await supabase
      .from('payments')
      .select('payment_status')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      isPaid: Boolean(res?.is_paid),
      paidAt: (res?.paid_at as string | null) ?? null,
      latestPaymentStatus: (pay?.payment_status as PaymentStatus | null) ?? null,
    };
  }
}

interface PaymentRow {
  id: string;
  user_id: string;
  resume_id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  payment_status: PaymentStatus;
  failure_reason: string | null;
  created_at: string;
  verified_at: string | null;
}

export async function fetchUserPayments(userId: string): Promise<PaymentRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('payments')
    .select('id, user_id, resume_id, razorpay_order_id, razorpay_payment_id, amount, currency, payment_status, failure_reason, created_at, verified_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as PaymentRow[]).map((r) => ({
    id: r.id,
    userId: r.user_id,
    resumeId: r.resume_id,
    razorpayOrderId: r.razorpay_order_id,
    razorpayPaymentId: r.razorpay_payment_id,
    amount: r.amount,
    currency: r.currency,
    paymentStatus: r.payment_status,
    failureReason: r.failure_reason,
    createdAt: r.created_at,
    verifiedAt: r.verified_at,
  }));
}
