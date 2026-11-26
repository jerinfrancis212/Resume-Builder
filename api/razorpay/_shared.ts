import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export const RESUME_PRICE_PAISE = 4900; // ₹49.00
export const RESUME_CURRENCY = 'INR';

export type ApiReq = IncomingMessage & { body?: unknown; query?: Record<string, string | string[]> };
export type ApiRes = ServerResponse;

export function sendJson(res: ApiRes, status: number, data: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

export async function readRawBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function readJsonBody<T = Record<string, unknown>>(req: ApiReq): Promise<T> {
  if (req.body && typeof req.body === 'object') return req.body as T;
  if (typeof req.body === 'string') return JSON.parse(req.body) as T;
  const raw = await readRawBody(req);
  if (!raw.length) return {} as T;
  return JSON.parse(raw.toString('utf8')) as T;
}

export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('Server misconfigured: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Server misconfigured: VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are required.');
  }
  return { keyId, keySecret };
}

export async function authenticateRequest(req: ApiReq, admin: SupabaseClient): Promise<User | null> {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;
  const { data, error } = await admin.auth.getUser(match[1]);
  if (error || !data.user) return null;
  return data.user;
}

/** Constant-time HMAC-SHA256 hex signature verification. */
export function verifyHmacSha256(payload: string | Buffer, receivedHex: string, secret: string): boolean {
  if (!receivedHex || !secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(receivedHex.trim().toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function razorpayRequest<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const { keyId, keySecret } = getRazorpayConfig();
  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const resp = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const text = await resp.text();
  let parsed: unknown = {};
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }
  if (!resp.ok) {
    const desc =
      (parsed as { error?: { description?: string } })?.error?.description ||
      `Razorpay API error (${resp.status})`;
    throw new Error(desc);
  }
  return parsed as T;
}

/** Idempotently marks a payment as successful and unlocks the resume's download entitlement. */
export async function unlockResumeEntitlement(
  admin: SupabaseClient,
  params: {
    orderId: string;
    paymentId: string;
    signature?: string | null;
    resumeId: string;
    userId: string;
  },
) {
  const now = new Date().toISOString();

  const { error: payErr } = await admin
    .from('payments')
    .update({
      razorpay_payment_id: params.paymentId,
      ...(params.signature ? { razorpay_signature: params.signature } : {}),
      payment_status: 'successful',
      failure_reason: null,
      verified_at: now,
    })
    .eq('razorpay_order_id', params.orderId);

  if (payErr) throw payErr;

  const { error: resErr } = await admin
    .from('resumes')
    .update({ is_paid: true, paid_at: now })
    .eq('id', params.resumeId)
    .eq('user_id', params.userId);

  if (resErr) throw resErr;

  // Record server-side analytics event (best-effort)
  await admin.from('analytics_events').insert({
    user_id: params.userId,
    resume_id: params.resumeId,
    event_name: 'payment_successful',
    metadata: {
      razorpay_order_id: params.orderId,
      razorpay_payment_id: params.paymentId,
      amount: RESUME_PRICE_PAISE,
      currency: RESUME_CURRENCY,
    },
  });
}
