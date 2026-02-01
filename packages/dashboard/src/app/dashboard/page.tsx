import { AuthGuard } from '@/components/AuthGuard';
import { DashboardOverview } from '@/components/DashboardOverview';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Overview</h1>
        <DashboardOverview />
      </div>
    </AuthGuard>
  );
}

