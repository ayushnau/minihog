'use client';

import { useEffect, useState } from 'react';
import { api, RetentionResponse } from '@/lib/api';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AuthGuard } from '@/components/AuthGuard';
import { format, subDays } from 'date-fns';

export default function RetentionPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cohort, setCohort] = useState('install');
  const [day, setDay] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RetentionResponse | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getRetentionAnalysis(cohort, day, from, to);
      setData(result);
    } catch (err) {
      setError('Failed to load retention data');
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
  }, [from, to, cohort, day]);

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Retention Analysis</h1>
      
      <DateRangePicker onDateChange={handleDateChange} />
      
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center space-x-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Cohort Event:</label>
            <input
              type="text"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              placeholder="e.g., install"
              className="border rounded px-3 py-1 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Day:</label>
            <input
              type="number"
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value) || 7)}
              min="1"
              className="border rounded px-3 py-1 text-sm w-20"
            />
          </div>
          <button
            onClick={loadData}
            className="px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
          >
            Analyze
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading retention data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Cohort Size</h3>
              <p className="text-3xl font-bold text-gray-900">{data.cohort_size.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Retained Users</h3>
              <p className="text-3xl font-bold text-gray-900">{data.retained_users.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Retention Rate</h3>
              <p className="text-3xl font-bold text-primary-600">
                {data.retention_percentage.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Retention Details</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Cohort Event:</span>
                <span className="text-gray-700">{data.cohort}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Retention Day:</span>
                <span className="text-gray-700">Day {data.day}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                <span className="font-medium">Date Range:</span>
                <span className="text-gray-700">
                  {new Date(data.from).toLocaleDateString()} - {new Date(data.to).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

