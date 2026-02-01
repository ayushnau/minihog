'use client';

import { useEffect, useState } from 'react';
import { api, EventCountResponse } from '@/lib/api';
import { DateRangePicker } from './DateRangePicker';
import { format, subDays } from 'date-fns';

export function DashboardOverview() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalEvents: number;
    uniqueUsers: number;
    events: EventCountResponse[];
  }>({
    totalEvents: 0,
    uniqueUsers: 0,
    events: [],
  });

  const commonEvents = ['install', 'signup', 'purchase', 'app_open'];

  useEffect(() => {
    loadData();
  }, [from, to]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const eventPromises = commonEvents.map((event) =>
        api.getEventCounts(event, from, to).catch((err) => {
          // Silently handle individual event errors
          return null;
        })
      );
      const results = await Promise.all(eventPromises);
      const validResults = results.filter((r) => r !== null) as EventCountResponse[];
      
      const totalEvents = validResults.reduce((sum, r) => sum + r.total_count, 0);
      // Get max unique users (since different events may have overlapping users)
      const uniqueUsers = validResults.length > 0 
        ? Math.max(...validResults.map((r) => r.unique_users), 0)
        : 0;

      setStats({
        totalEvents,
        uniqueUsers,
        events: validResults,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DateRangePicker onDateChange={handleDateChange} defaultDays={7} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Events</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalEvents.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Unique Users</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.uniqueUsers.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Event Types</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.events.length}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Event Breakdown</h2>
        {stats.events.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No events found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Try adjusting your date range or start tracking events</p>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.events.map((event) => (
              <div key={event.event} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">{event.event}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.unique_users} unique users</p>
                </div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{event.total_count.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

