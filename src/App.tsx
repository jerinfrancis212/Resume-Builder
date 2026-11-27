import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { HomePage } from '@/pages/HomePage';
import { TemplatesPage } from '@/pages/TemplatesPage';
import { EditorPage } from '@/pages/EditorPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AuthModal } from '@/components/AuthModal';
import { InAppBrowserBanner } from '@/components/InAppBrowserBanner';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';

export function App() {
  const initAuth = useAuthStore((s) => s.init);
  const user = useAuthStore((s) => s.user);
  const syncForUser = useResumeStore((s) => s.syncForUser);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    syncForUser(user?.id ?? null);
  }, [user?.id, syncForUser]);

  return (
    <BrowserRouter>
      <InAppBrowserBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/editor/:id" element={<EditorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AuthModal />
      <Toaster position="bottom-right" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
