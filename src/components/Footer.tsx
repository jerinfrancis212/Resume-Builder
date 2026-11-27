import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './Navbar';
import { MobileBottomNav } from './MobileBottomNav';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type LegalDoc = 'about' | 'contact' | 'privacy' | 'terms' | null;

const DOCS: Record<Exclude<LegalDoc, null>, { title: string; subtitle: string; body: string[] }> = {
  about: {
    title: 'About Norvel',
    subtitle: 'Modern, distraction-free resume creation for every stage of your career.',
    body: [
      'Norvel was built so anyone—from first-time graduates to senior executives—can craft a sharp, ATS-friendly, print-perfect resume without fighting word-processor formatting.',
      'Every template is rendered directly to real, selectable-text A4 PDF using embedded typography, ensuring your live preview and downloaded file match pixel for pixel.',
    ],
  },
  contact: {
    title: 'Contact Us',
    subtitle: 'Questions, feedback, or template suggestions?',
    body: [
      'Email us anytime at support@norvel.in. We typically respond within one business day.',
      'If you are reporting a layout or export issue, include the template name and browser version so we can reproduce it quickly.',
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Your career data belongs to you.',
    body: [
      'Guest drafts are stored exclusively in your browser’s local storage and never leave your device until you choose to sign in.',
      'When you create an account, your resumes are stored securely in Supabase with strict Row Level Security so only your authenticated session can read or edit them. We never sell or share your personal information.',
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Simple, transparent terms for using Norvel.',
    body: [
      'You retain 100% ownership of all resume content and PDFs you create with Norvel.',
      'Norvel is provided as-is. Please review your generated PDF before submitting job applications to ensure all details, dates, and contact links are accurate.',
    ],
  },
};

export function Footer() {
  const [doc, setDoc] = useState<LegalDoc>(null);

  return (
    <>
      <footer className="border-t border-border bg-secondary/30 pb-20 md:pb-0">
      <div className="container py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <BrandLogo />
            <p className="text-sm text-muted-foreground max-w-sm">
              Build a clean, job-ready resume in minutes with professionally typeset A4 PDF templates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-2 text-sm text-muted-foreground">
            <Link to="/templates" className="hover:text-foreground transition-colors">
              Templates
            </Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              My Resumes
            </Link>
            <button type="button" onClick={() => setDoc('about')} className="hover:text-foreground transition-colors">
              About
            </button>
            <button type="button" onClick={() => setDoc('contact')} className="hover:text-foreground transition-colors">
              Contact
            </button>
            <button type="button" onClick={() => setDoc('privacy')} className="hover:text-foreground transition-colors">
              Privacy Policy
            </button>
            <button type="button" onClick={() => setDoc('terms')} className="hover:text-foreground transition-colors">
              Terms
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-border/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Norvel. All rights reserved.</p>
          <p>True A4 vector PDF export · Selectable text · ATS-ready</p>
        </div>
      </div>

      <Dialog open={doc !== null} onOpenChange={(o) => !o && setDoc(null)}>
        <DialogContent>
          {doc && (
            <>
              <DialogHeader>
                <DialogTitle>{DOCS[doc].title}</DialogTitle>
                <DialogDescription>{DOCS[doc].subtitle}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm leading-relaxed text-foreground/85">
                {DOCS[doc].body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </footer>
    <MobileBottomNav />
    </>
  );
}
