'use client';

import AppNavigation from '@/components/AppNavigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AppNavigation />
      <main className="md:ml-60 pt-14 md:pt-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
