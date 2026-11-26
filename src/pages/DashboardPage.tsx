import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Download,
  FilePlus2,
  Loader2,
  MoreVertical,
  Pencil,
  Receipt,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import type { PaymentRecord, PaymentStatus, ResumeDocument } from '@/types/resume';
import { getTemplate } from '@/templates/meta';
import { downloadResumePdf } from '@/pdf/renderer';
import { OFFER_PRICE_INR, checkResumeEntitlement, fetchUserPayments } from '@/lib/payments/razorpay';
import { trackEvent } from '@/lib/analytics';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { TemplateThumbnail } from '@/components/TemplateThumbnail';
import { PaymentModal } from '@/components/PaymentModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/primitives';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/controls';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const PAYMENT_STATUS_STYLE: Record<PaymentStatus, { label: string; className: string }> = {
  successful: { label: 'Successful', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  created: { label: 'Initiated', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  failed: { label: 'Failed', className: 'bg-red-50 text-red-700 border-red-200' },
  refunded: { label: 'Refunded', className: 'bg-purple-50 text-purple-700 border-purple-200' },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const { resumes, loading, duplicateResume, deleteResume, markResumePaid } = useResumeStore();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<ResumeDocument | null>(null);
  const [paymentDoc, setPaymentDoc] = useState<ResumeDocument | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const loadPayments = async (uid: string) => {
    setLoadingPayments(true);
    try {
      const list = await fetchUserPayments(uid);
      setPayments(list);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setPayments([]);
      return;
    }
    void loadPayments(user.id);
  }, [user]);

  const latestStatusByResume = useMemo(() => {
    const map = new Map<string, PaymentStatus>();
    for (const p of payments) {
      if (!map.has(p.resumeId)) map.set(p.resumeId, p.paymentStatus);
    }
    return map;
  }, [payments]);

  const resumeNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of resumes) map.set(r.id, r.name);
    return map;
  }, [resumes]);

  const triggerPdfDownload = async (doc: ResumeDocument) => {
    setDownloadingId(doc.id);
    try {
      await downloadResumePdf(doc.templateId, doc.data, doc.customization);
      void trackEvent('pdf_downloaded', { userId: user?.id, resumeId: doc.id, metadata: { source: 'dashboard' } });
      toast.success(`Downloaded ${doc.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadOrUnlock = async (doc: ResumeDocument) => {
    void trackEvent('download_clicked', { userId: user?.id, resumeId: doc.id, metadata: { source: 'dashboard' } });
    if (!user) {
      openAuthModal(
        'Sign in with your Google account to unlock PDF downloads and sync your resumes.',
        'download',
      );
      return;
    }

    setDownloadingId(doc.id);
    try {
      const entitlement = await checkResumeEntitlement(doc.id);
      if (entitlement.isPaid) {
        markResumePaid(doc.id, entitlement.paidAt);
        await triggerPdfDownload(doc);
      } else {
        setDownloadingId(null);
        setPaymentDoc(doc);
      }
    } catch (err) {
      setDownloadingId(null);
      toast.error(err instanceof Error ? err.message : 'Could not verify payment status');
    }
  };

  const handleDuplicate = (doc: ResumeDocument) => {
    const copy = duplicateResume(doc.id);
    if (copy) toast.success(`Duplicated "${doc.name}" (new resumes require a separate unlock for PDF download)`);
  };

  const confirmDelete = async () => {
    if (!deletingDoc) return;
    const name = deletingDoc.name;
    await deleteResume(deletingDoc.id);
    setDeletingDoc(null);
    toast.success(`Deleted "${name}"`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 container py-10 sm:py-12 space-y-12">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">My Resumes</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage multiple tailored resumes and re-download purchased PDFs anytime.
              </p>
            </div>
            <Button asChild>
              <Link to="/templates">
                <FilePlus2 className="h-4 w-4" />
                Create New Resume
              </Link>
            </Button>
          </div>

          {/* Guest cloud-sync banner */}
          {!user && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-border bg-secondary/45 px-5 py-4">
              <div className="flex items-start gap-3">
                <Cloud className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Your drafts are saved locally in this browser</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Sign in with Google to back up your resumes to the cloud and edit them from any device.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 bg-background"
                onClick={() => openAuthModal('Sign in with Google to sync your local drafts to your account.')}
              >
                Sign In to Sync
              </Button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading your resumes…</span>
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-20 px-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary mb-4">
                <FilePlus2 className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">No resumes yet</h2>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
                Pick one of our 13 professionally typeset templates and create your first job-ready resume in minutes.
              </p>
              <Button className="mt-6" asChild>
                <Link to="/templates">Explore Templates</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.map((doc) => {
                const tpl = getTemplate(doc.templateId);
                const isBusy = downloadingId === doc.id;
                const latestPayStatus = latestStatusByResume.get(doc.id);
                const statusKind: 'purchased' | 'pending' | 'unpaid' = doc.isPaid
                  ? 'purchased'
                  : latestPayStatus === 'pending'
                    ? 'pending'
                    : 'unpaid';

                return (
                  <div
                    key={doc.id}
                    className="group rounded-xl border border-border bg-card p-4 shadow-soft transition-all hover:shadow-lift hover:border-primary/30 flex flex-col"
                  >
                    <button
                      type="button"
                      onClick={() => navigate(`/editor/${doc.id}`)}
                      className="relative mb-4 block w-full overflow-hidden rounded-lg text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {/* Payment status pill on thumbnail */}
                      <span
                        className={cn(
                          'absolute right-2.5 top-2.5 z-10 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold shadow-sm backdrop-blur-sm',
                          statusKind === 'purchased' && 'bg-emerald-50/95 text-emerald-700 border-emerald-200',
                          statusKind === 'pending' && 'bg-amber-50/95 text-amber-700 border-amber-200',
                          statusKind === 'unpaid' && 'bg-white/95 text-muted-foreground border-border',
                        )}
                      >
                        {statusKind === 'purchased' && (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Purchased
                          </>
                        )}
                        {statusKind === 'pending' && (
                          <>
                            <Clock className="h-3 w-3" />
                            Payment Pending
                          </>
                        )}
                        {statusKind === 'unpaid' && 'Not Purchased'}
                      </span>

                      <TemplateThumbnail
                        templateId={doc.templateId}
                        data={doc.data}
                        customization={doc.customization}
                        versionKey={`${doc.id}:${doc.updatedAt}`}
                        className="transition-transform duration-300 group-hover:scale-[1.015]"
                      />
                    </button>

                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-foreground truncate">{doc.name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0">
                            {tpl.name}
                          </Badge>
                          <span>Updated {formatRelativeDate(doc.updatedAt)}</span>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Resume actions">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/editor/${doc.id}`)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            Edit Resume
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(doc)}>
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadOrUnlock(doc)}>
                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                            Download PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingDoc(doc)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/70 flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => navigate(`/editor/${doc.id}`)}>
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isBusy}
                        onClick={() => handleDownloadOrUnlock(doc)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        Download PDF
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchase History Section (for authenticated users) */}
        {user && (
          <section className="pt-4 border-t border-border/80">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Receipt className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Purchase History</h2>
                  <p className="text-xs text-muted-foreground">All Razorpay transactions linked to your account.</p>
                </div>
              </div>
            </div>

            {loadingPayments ? (
              <div className="flex items-center gap-2 py-8 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading purchase history…
              </div>
            ) : payments.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                No payments yet. Unlock any resume for ₹{OFFER_PRICE_INR} to download its A4 PDF anytime.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-soft">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-secondary/40 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 font-medium">Resume</th>
                      <th className="px-4 py-3 font-medium">Amount</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Reference ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {payments.map((p) => {
                      const st = PAYMENT_STATUS_STYLE[p.paymentStatus] ?? PAYMENT_STATUS_STYLE.created;
                      return (
                        <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            {resumeNameMap.get(p.resumeId) || 'Resume'}
                          </td>
                          <td className="px-4 py-3 font-medium text-foreground">
                            ₹{(p.amount / 100).toFixed(0)} {p.currency}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDateTime(p.verifiedAt || p.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium', st.className)}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                            {p.razorpayPaymentId || p.razorpayOrderId}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      <Footer />

      <PaymentModal
        resume={paymentDoc}
        onClose={() => setPaymentDoc(null)}
        onUnlocked={(unlockedDoc) => {
          void triggerPdfDownload(unlockedDoc);
          if (user) void loadPayments(user.id);
        }}
      />

      <Dialog open={deletingDoc !== null} onOpenChange={(o) => !o && setDeletingDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete resume?</DialogTitle>
            <DialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{deletingDoc?.name}</span>. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Resume
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
