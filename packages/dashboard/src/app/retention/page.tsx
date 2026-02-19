'use client';

import { useEffect, useState } from 'react';
import { api, RetentionResponse } from '@/lib/api';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AuthGuard } from '@/components/AuthGuard';
import { format, subDays } from 'date-fns';
import { useDebounce } from '@/lib/useDebounce';

export default function RetentionPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cohort, setCohort] = useState('install');
  const [day, setDay] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RetentionResponse | null>(null);

  // Debounce cohort to prevent API calls on every keystroke
  const debouncedCohort = useDebounce(cohort, 500);

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  useEffect(() => {
    // Only load if cohort is not empty
    if (!debouncedCohort.trim()) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Validate day
    if (!day || day < 1) {
      setError('Day must be at least 1');
      setLoading(false);
      return;
    }

    // Load data with debounced value
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await api.getRetentionAnalysis(debouncedCohort.trim(), day, from, to);
        setData(result);
      } catch (err) {
        setError('Failed to load retention data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [from, to, debouncedCohort, day]);

  const loadData = async () => {
    // Validate cohort before making API call
    if (!cohort || !cohort.trim()) {
      setError('Please enter a cohort event name');
      setLoading(false);
      return;
    }

    // Validate day
    if (!day || day < 1) {
      setError('Day must be at least 1');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await api.getRetentionAnalysis(cohort.trim(), day, from, to);
      setData(result);
    } catch (err) {
      setError('Failed to load retention data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Retention Analysis</h1>
      
      <DateRangePicker onDateChange={handleDateChange} />
      
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-3 flex-wrap">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mr-2">Cohort Event:</label>
            <input
              type="text"
              value={cohort}
              onChange={(e) => setCohort(e.target.value)}
              onKeyDown={(e) => {
                // Only trigger on Enter if cohort is not empty
                if (e.key === 'Enter' && cohort.trim()) {
                  loadData();
                }
              }}
              placeholder="e.g., install"
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 sm:py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px] sm:min-h-0 w-full sm:w-auto"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1 sm:mr-2">Day:</label>
            <input
              type="number"
              value={day}
              onChange={(e) => setDay(parseInt(e.target.value) || 7)}
              min="1"
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 sm:py-1.5 text-sm w-20 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px] sm:min-h-0"
            />
          </div>
          <button
            onClick={loadData}
            disabled={!cohort.trim()}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
          >
            Analyze
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading retention data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {!error && !loading && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Cohort Size</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.cohort_size.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Retained Users</h3>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.retained_users.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Retention Rate</h3>
              <p className="text-3xl font-bold text-primary-600">
                {data.retention_percentage.toFixed(2)}%
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Retention Details</h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-medium text-gray-900 dark:text-white">Cohort Event:</span>
                <span className="text-gray-700 dark:text-gray-300">{data.cohort}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-medium text-gray-900 dark:text-white">Retention Day:</span>
                <span className="text-gray-700 dark:text-gray-300">Day {data.day}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="font-medium text-gray-900 dark:text-white">Date Range:</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(data.from).toLocaleDateString()} - {new Date(data.to).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!error && !loading && !data && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No retention data available for the selected criteria.</p>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

