import {
  RESUME_CURRENCY,
  RESUME_PRICE_PAISE,
  authenticateRequest,
  getRazorpayConfig,
  getSupabaseAdmin,
  razorpayRequest,
  readJsonBody,
  sendJson,
  type ApiReq,
  type ApiRes,
} from './_shared';

interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export default async function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const admin = getSupabaseAdmin();
    const user = await authenticateRequest(req, admin);
    if (!user) {
      return sendJson(res, 401, { error: 'Authentication required. Please sign in with Google.' });
    }

    const { resumeId } = await readJsonBody<{ resumeId?: string }>(req);
    if (!resumeId || typeof resumeId !== 'string') {
      return sendJson(res, 400, { error: 'Missing resumeId' });
    }

    // 1. Validate resume ownership
    const { data: resume, error: resumeErr } = await admin
      .from('resumes')
      .select('id, user_id, resume_name, is_paid, paid_at, updated_at')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (resumeErr || !resume) {
      return sendJson(res, 404, { error: 'Resume not found or access denied.' });
    }

    // 2. If the current unedited version is already paid, allow free re-download without charging twice.
    //    If the user edited the resume since their last payment, revoke is_paid and create a fresh ₹49 order.
    let stillPaid = Boolean(resume.is_paid);
    if (stillPaid && resume.paid_at && resume.updated_at) {
      if (new Date(resume.updated_at).getTime() > new Date(resume.paid_at).getTime() + 2000) {
        await admin
          .from('resumes')
          .update({ is_paid: false, paid_at: null })
          .eq('id', resumeId)
          .eq('user_id', user.id);
        stillPaid = false;
      }
    }

    if (stillPaid) {
      return sendJson(res, 200, { alreadyPaid: true });
    }

    const { keyId } = getRazorpayConfig();

    // 3. Create a fresh Razorpay order for ₹49 (4900 paise)
    const receipt = `res_${resumeId.replace(/-/g, '').slice(0, 18)}_${Date.now().toString(36)}`.slice(0, 40);
    const order = await razorpayRequest<RazorpayOrderResponse>('/orders', {
      method: 'POST',
      body: {
        amount: RESUME_PRICE_PAISE,
        currency: RESUME_CURRENCY,
        receipt,
        notes: {
          user_id: user.id,
          resume_id: resumeId,
          resume_name: resume.resume_name || 'Resume',
        },
      },
    });

    // 4. Record the created order in public.payments
    const { error: insertErr } = await admin.from('payments').insert({
      user_id: user.id,
      resume_id: resumeId,
      razorpay_order_id: order.id,
      amount: RESUME_PRICE_PAISE,
      currency: RESUME_CURRENCY,
      payment_status: 'created',
    });

    if (insertErr) {
      throw insertErr;
    }

    return sendJson(res, 200, {
      alreadyPaid: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      resumeName: resume.resume_name || 'Resume',
    });
  } catch (err) {
    console.error('[razorpay/create-order]', err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to create payment order' });
  }
}
