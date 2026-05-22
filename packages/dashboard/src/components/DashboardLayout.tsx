'use client';
import AppNavigation from './AppNavigation';
import AuthGuard from './AuthGuard';
import AiWidget from './AiWidget';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="mh-app crt">
        <AppNavigation />
        <main>
          {children}
        </main>
        <AiWidget />
      </div>
    </AuthGuard>
  );
}
