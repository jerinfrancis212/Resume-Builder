import {
  RESUME_CURRENCY,
  RESUME_PRICE_PAISE,
  authenticateRequest,
  getRazorpayConfig,
  getSupabaseAdmin,
  razorpayRequest,
  readJsonBody,
  sendJson,
  unlockResumeEntitlement,
  verifyHmacSha256,
  type ApiReq,
  type ApiRes,
} from './_shared.js';

interface RazorpayPaymentResponse {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: string;
}

interface VerifyBody {
  action?: 'verify' | 'mark_failed';
  resumeId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  reason?: string;
}

export default async function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const admin = getSupabaseAdmin();
    const user = await authenticateRequest(req, admin);
    if (!user) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const body = await readJsonBody<VerifyBody>(req);
    const { resumeId, razorpay_order_id } = body;

    if (!resumeId || !razorpay_order_id) {
      return sendJson(res, 400, { error: 'Missing resumeId or razorpay_order_id.' });
    }

    // Fetch payment record and confirm it belongs to this user and resume
    const { data: paymentRow, error: rowErr } = await admin
      .from('payments')
      .select('id, user_id, resume_id, amount, currency, payment_status, razorpay_payment_id')
      .eq('razorpay_order_id', razorpay_order_id)
      .single();

    if (rowErr || !paymentRow) {
      return sendJson(res, 404, { error: 'Payment order not found.' });
    }
    if (paymentRow.user_id !== user.id || paymentRow.resume_id !== resumeId) {
      return sendJson(res, 403, { error: 'Order does not belong to this user or resume.' });
    }

    // Handle explicit failure reporting from checkout modal (never downgrades an already successful payment)
    if (body.action === 'mark_failed') {
      if (paymentRow.payment_status !== 'successful') {
        await admin
          .from('payments')
          .update({
            payment_status: 'failed',
            failure_reason: body.reason || 'Payment failed or cancelled',
            ...(body.razorpay_payment_id ? { razorpay_payment_id: body.razorpay_payment_id } : {}),
          })
          .eq('razorpay_order_id', razorpay_order_id)
          .neq('payment_status', 'successful');

        await admin.from('analytics_events').insert({
          user_id: user.id,
          resume_id: resumeId,
          event_name: 'payment_failed',
          metadata: { razorpay_order_id, reason: body.reason || 'Payment failed' },
        });
      }
      return sendJson(res, 200, { recorded: true });
    }

    // Already verified (e.g. webhook beat the client callback or duplicate callback)
    if (paymentRow.payment_status === 'successful') {
      await admin
        .from('resumes')
        .update({ is_paid: true })
        .eq('id', resumeId)
        .eq('user_id', user.id);
      return sendJson(res, 200, { verified: true, alreadyVerified: true });
    }

    const { razorpay_payment_id, razorpay_signature } = body;
    if (!razorpay_payment_id || !razorpay_signature) {
      return sendJson(res, 400, { error: 'Missing payment ID or signature.' });
    }

    // 1. Cryptographically verify Razorpay HMAC-SHA256 signature
    const { keySecret } = getRazorpayConfig();
    const signatureValid = verifyHmacSha256(
      `${razorpay_order_id}|${razorpay_payment_id}`,
      razorpay_signature,
      keySecret,
    );

    if (!signatureValid) {
      await admin
        .from('payments')
        .update({ payment_status: 'failed', failure_reason: 'Invalid payment signature' })
        .eq('razorpay_order_id', razorpay_order_id)
        .neq('payment_status', 'successful');
      return sendJson(res, 400, { error: 'Invalid payment signature. Verification failed.' });
    }

    // 2. Cross-verify payment directly with Razorpay API (amount, currency, order_id, status)
    const rzpPayment = await razorpayRequest<RazorpayPaymentResponse>(`/payments/${razorpay_payment_id}`);
    if (
      rzpPayment.order_id !== razorpay_order_id ||
      rzpPayment.amount !== RESUME_PRICE_PAISE ||
      rzpPayment.currency !== RESUME_CURRENCY
    ) {
      await admin
        .from('payments')
        .update({ payment_status: 'failed', failure_reason: 'Amount or order mismatch' })
        .eq('razorpay_order_id', razorpay_order_id)
        .neq('payment_status', 'successful');
      return sendJson(res, 400, { error: 'Payment amount, currency, or order mismatch.' });
    }

    if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
      const nextStatus = rzpPayment.status === 'failed' ? 'failed' : 'pending';
      await admin
        .from('payments')
        .update({
          razorpay_payment_id,
          payment_status: nextStatus,
          failure_reason: nextStatus === 'failed' ? 'Payment not captured' : null,
        })
        .eq('razorpay_order_id', razorpay_order_id)
        .neq('payment_status', 'successful');
      return sendJson(res, 402, {
        verified: false,
        status: nextStatus,
        error: nextStatus === 'pending' ? 'Payment is still pending confirmation.' : 'Payment was not completed.',
      });
    }

    // 3. Unlock entitlement atomically via service_role
    await unlockResumeEntitlement(admin, {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
      resumeId,
      userId: user.id,
    });

    return sendJson(res, 200, { verified: true });
  } catch (err) {
    console.error('[razorpay/verify-payment]', err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Payment verification failed' });
  }
}
