'use client';

import { useEffect, useState } from 'react';
import { api, FunnelResponse } from '@/lib/api';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AuthGuard } from '@/components/AuthGuard';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FunnelPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [steps, setSteps] = useState('install,signup,purchase');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FunnelResponse | null>(null);

  const loadData = async () => {
    // Validate steps before making API call
    if (!steps || !steps.trim()) {
      setError('Please enter at least 2 funnel steps');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const stepArray = steps.split(',').map(s => s.trim()).filter(Boolean);
      if (stepArray.length < 2) {
        setError('At least 2 steps required');
        setLoading(false);
        return;
      }
      const result = await api.getFunnelAnalysis(stepArray, from, to);
      setData(result);
    } catch (err) {
      setError('Failed to load funnel data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  useEffect(() => {
    loadData();
  }, [from, to]);

  const chartData = data?.funnel.map((step) => ({
    name: step.event_name,
    users: step.users,
    dropOff: step.drop_off_percentage,
  })) || [];

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Funnel Analysis</h1>
      
      <DateRangePicker onDateChange={handleDateChange} />
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 shrink-0 w-full sm:w-auto">Funnel Steps (comma-separated):</label>
          <input
            type="text"
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            onKeyDown={(e) => {
              // Only trigger on Enter if steps are not empty
              if (e.key === 'Enter' && steps.trim()) {
                loadData();
              }
            }}
            placeholder="e.g., install,signup,purchase"
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 sm:py-1.5 text-sm flex-1 min-w-0 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px] sm:min-h-0"
          />
          <button
            onClick={loadData}
            disabled={!steps.trim()}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
          >
            Analyze
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading funnel data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!error && !loading && data && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Funnel Visualization</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Total users at first step: {data.total_users_at_first_step.toLocaleString()}
            </p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill="#0ea5e9" name="Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Funnel Steps</h3>
            <div className="space-y-4">
              {data.funnel.map((step, index) => (
                <div key={step.step} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Step {step.step}: {step.event_name}
                    </p>
                    {index > 0 && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Drop-off: {step.drop_off_percentage.toFixed(2)}%
                      </p>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary-600 shrink-0">
                    {step.users.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!error && !loading && !data && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No funnel data available for the selected criteria.</p>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

