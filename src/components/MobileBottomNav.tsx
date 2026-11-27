import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Home, LayoutTemplate, PenLine, User } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';

/**
 * Native-app style bottom tab bar shown only on mobile (< md) across
 * Home, Templates, and Dashboard pages. Hidden on desktop so Web UI is untouched.
 */
export function MobileBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuthStore();
  const { resumes } = useResumeStore();

  const itemClass = (active: boolean) =>
    cn(
      'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10.5px] font-medium transition-colors active:scale-95',
      active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
    );

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border/80 bg-background/95 backdrop-blur-md shadow-[0_-2px_12px_rgba(15,23,42,0.06)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex h-15 items-stretch px-1">
        <Link to="/" className={itemClass(pathname === '/')}>
          <Home className={cn('h-5 w-5', pathname === '/' && 'stroke-[2.25]')} />
          <span>Home</span>
        </Link>

        <Link to="/templates" className={itemClass(pathname === '/templates')}>
          <LayoutTemplate className={cn('h-5 w-5', pathname === '/templates' && 'stroke-[2.25]')} />
          <span>Templates</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            if (pathname === '/' || resumes.length === 0) {
              navigate('/templates', { state: { pickTemplatePrompt: true } });
            } else {
              navigate(`/editor/${resumes[0].id}`);
            }
          }}
          className={itemClass(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft -mt-0.5">
            <PenLine className="h-4 w-4" />
          </span>
          <span className="text-primary font-semibold">Editor</span>
        </button>

        <Link to="/dashboard" className={itemClass(pathname === '/dashboard')}>
          <FileText className={cn('h-5 w-5', pathname === '/dashboard' && 'stroke-[2.25]')} />
          <span>My CVs</span>
        </Link>

        {user ? (
          <Link to="/dashboard" className={itemClass(false)}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
              {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
            </span>
            <span>Account</span>
          </Link>
        ) : (
          <button type="button" onClick={() => openAuthModal()} className={itemClass(false)}>
            <User className="h-5 w-5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </nav>
  );
}
