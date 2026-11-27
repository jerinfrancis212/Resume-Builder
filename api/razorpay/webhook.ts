import {
  RESUME_CURRENCY,
  RESUME_PRICE_PAISE,
  getSupabaseAdmin,
  readRawBody,
  sendJson,
  unlockResumeEntitlement,
  verifyHmacSha256,
  type ApiReq,
  type ApiRes,
} from './_shared.js';

/** Disable automatic body parsing so we verify the signature against the exact raw bytes. */
export const config = {
  api: {
    bodyParser: false,
  },
};

interface WebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id: string;
        order_id?: string;
        amount: number;
        currency: string;
        status: string;
        error_description?: string;
        notes?: { user_id?: string; resume_id?: string };
      };
    };
    order?: {
      entity?: {
        id: string;
        amount: number;
        currency: string;
        notes?: { user_id?: string; resume_id?: string };
      };
    };
    refund?: {
      entity?: {
        id: string;
        payment_id: string;
      };
    };
  };
}

export default async function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return sendJson(res, 500, { error: 'RAZORPAY_WEBHOOK_SECRET is not configured.' });
    }

    const rawBody = await readRawBody(req);
    const signature = String(req.headers['x-razorpay-signature'] || '');

    if (!verifyHmacSha256(rawBody, signature, webhookSecret)) {
      return sendJson(res, 400, { error: 'Invalid webhook signature.' });
    }

    const body = JSON.parse(rawBody.toString('utf8')) as WebhookPayload;
    const eventType = body.event || 'unknown';
    const paymentEntity = body.payload?.payment?.entity;
    const orderEntity = body.payload?.order?.entity;
    const refundEntity = body.payload?.refund?.entity;

    const eventId =
      String(req.headers['x-razorpay-event-id'] || '') ||
      `${eventType}:${paymentEntity?.id || orderEntity?.id || refundEntity?.id || Date.now()}`;

    const admin = getSupabaseAdmin();

    // Idempotency check: insert event_id first; duplicate primary key means already processed
    const { error: dupErr } = await admin.from('payment_webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      payload: body,
    });

    if (dupErr) {
      if (dupErr.code === '23505') {
        return sendJson(res, 200, { received: true, duplicate: true });
      }
      throw dupErr;
    }

    const orderId = paymentEntity?.order_id || orderEntity?.id;

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (!orderId) return sendJson(res, 200, { received: true, ignored: 'missing order_id' });

      const amount = paymentEntity?.amount ?? orderEntity?.amount;
      const currency = paymentEntity?.currency ?? orderEntity?.currency;
      if (amount !== RESUME_PRICE_PAISE || currency !== RESUME_CURRENCY) {
        return sendJson(res, 200, { received: true, ignored: 'amount or currency mismatch' });
      }

      const { data: row } = await admin
        .from('payments')
        .select('user_id, resume_id, payment_status')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();

      if (row && row.payment_status !== 'successful') {
        await unlockResumeEntitlement(admin, {
          orderId,
          paymentId: paymentEntity?.id || `order_${orderId}`,
          resumeId: row.resume_id,
          userId: row.user_id,
        });
      }
      return sendJson(res, 200, { received: true });
    }

    if (eventType === 'payment.authorized' && orderId) {
      await admin
        .from('payments')
        .update({
          payment_status: 'pending',
          ...(paymentEntity?.id ? { razorpay_payment_id: paymentEntity.id } : {}),
        })
        .eq('razorpay_order_id', orderId)
        .in('payment_status', ['created']);
      return sendJson(res, 200, { received: true });
    }

    if (eventType === 'payment.failed' && orderId) {
      await admin
        .from('payments')
        .update({
          payment_status: 'failed',
          failure_reason: paymentEntity?.error_description || 'Payment failed',
          ...(paymentEntity?.id ? { razorpay_payment_id: paymentEntity.id } : {}),
        })
        .eq('razorpay_order_id', orderId)
        .neq('payment_status', 'successful');
      return sendJson(res, 200, { received: true });
    }

    if (eventType === 'payment.refunded' || eventType === 'refund.created') {
      const paymentId = refundEntity?.payment_id || paymentEntity?.id;
      if (paymentId) {
        const { data: row } = await admin
          .from('payments')
          .select('resume_id, user_id')
          .eq('razorpay_payment_id', paymentId)
          .maybeSingle();

        if (row) {
          await admin
            .from('payments')
            .update({ payment_status: 'refunded' })
            .eq('razorpay_payment_id', paymentId);
          await admin
            .from('resumes')
            .update({ is_paid: false, paid_at: null })
            .eq('id', row.resume_id)
            .eq('user_id', row.user_id);
        }
      }
      return sendJson(res, 200, { received: true });
    }

    return sendJson(res, 200, { received: true });
  } catch (err) {
    console.error('[razorpay/webhook]', err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Webhook processing error' });
  }
}
