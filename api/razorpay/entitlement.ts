import { authenticateRequest, getSupabaseAdmin, sendJson, type ApiReq, type ApiRes } from './_shared';

export default async function handler(req: ApiReq, res: ApiRes) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const admin = getSupabaseAdmin();
    const user = await authenticateRequest(req, admin);
    if (!user) {
      return sendJson(res, 401, { error: 'Authentication required.' });
    }

    const url = new URL(req.url || '', 'http://localhost');
    const resumeId = url.searchParams.get('resumeId');
    if (!resumeId) {
      return sendJson(res, 400, { error: 'Missing resumeId query parameter.' });
    }

    const { data: resume, error: resErr } = await admin
      .from('resumes')
      .select('id, is_paid, paid_at, updated_at')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (resErr || !resume) {
      return sendJson(res, 404, { error: 'Resume not found.' });
    }

    // If the resume was edited & saved after its last verified payment, revoke the old unlock
    let isPaid = Boolean(resume.is_paid);
    let paidAt: string | null = resume.paid_at ?? null;
    if (isPaid && paidAt && resume.updated_at) {
      const updatedMs = new Date(resume.updated_at).getTime();
      const paidMs = new Date(paidAt).getTime();
      if (updatedMs > paidMs + 2000) {
        await admin
          .from('resumes')
          .update({ is_paid: false, paid_at: null })
          .eq('id', resumeId)
          .eq('user_id', user.id);
        isPaid = false;
        paidAt = null;
      }
    }

    const { data: latestPayment } = await admin
      .from('payments')
      .select('payment_status')
      .eq('resume_id', resumeId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return sendJson(res, 200, {
      isPaid,
      paidAt,
      latestPaymentStatus: latestPayment?.payment_status ?? null,
    });
  } catch (err) {
    console.error('[razorpay/entitlement]', err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : 'Failed to check entitlement' });
  }
}
