import { AuthGuard } from '@/components/AuthGuard';
import { DashboardOverview } from '@/components/DashboardOverview';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Overview</h1>
        <DashboardOverview />
      </div>
    </AuthGuard>
  );
}

