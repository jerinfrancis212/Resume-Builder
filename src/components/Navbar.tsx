import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/controls';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import { cn } from '@/lib/utils';

export function BrandLogo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <img
        src="/norvel-logo.jpg"
        alt="Norvel logo"
        className="h-8 w-8 rounded-lg object-cover shadow-soft transition-transform group-hover:scale-[1.03]"
      />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">Norvel</span>
    </Link>
  );
}

export function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, openAuthModal, signOut } = useAuthStore();
  const { resumes } = useResumeStore();

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        'text-sm font-medium transition-colors hover:text-foreground',
        pathname === to ? 'text-foreground' : 'text-muted-foreground',
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <BrandLogo />
          <nav className="hidden md:flex items-center gap-6">
            {navLink('/templates', 'Templates')}
            {navLink('/dashboard', 'My Resumes')}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-[140px] truncate">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2.5 py-1.5">
                  <p className="text-xs font-medium text-foreground truncate">{user.user_metadata?.full_name || 'Account'}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  My Resumes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/templates')}>
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  Browse Templates
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => openAuthModal()}>
              <User className="h-4 w-4" />
              Sign In
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              if (resumes.length > 0) {
                navigate(`/editor/${resumes[0].id}`);
              } else {
                navigate('/templates');
              }
            }}
          >
            {resumes.length > 0 ? 'Open Editor' : 'Create My Resume'}
          </Button>
        </div>
      </div>
    </header>
  );
}
