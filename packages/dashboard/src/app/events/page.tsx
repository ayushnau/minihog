'use client';

import { useEffect, useState } from 'react';
import { api, EventCountResponse } from '@/lib/api';
import { DateRangePicker } from '@/components/DateRangePicker';
import { AuthGuard } from '@/components/AuthGuard';
import { format, subDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function EventsPage() {
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventName, setEventName] = useState('install');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EventCountResponse | null>(null);

  useEffect(() => {
    loadData();
  }, [from, to, eventName]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getEventCounts(eventName, from, to);
      setData(result);
    } catch (err) {
      setError('Failed to load event data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Event Analytics</h1>
      
      <DateRangePicker onDateChange={handleDateChange} />
      
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="text-sm font-medium text-gray-700 mr-4">Event Name:</label>
        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="e.g., install, signup, purchase"
          className="border rounded px-3 py-1 text-sm"
        />
        <button
          onClick={loadData}
          className="ml-4 px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
        >
          Load
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading event data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Total Events</h3>
              <p className="text-4xl font-bold text-primary-600">{data.total_count.toLocaleString()}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Unique Users</h3>
              <p className="text-4xl font-bold text-primary-600">{data.unique_users.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Event: {data.event}</h3>
            <p className="text-sm text-gray-500 mb-4">
              From {new Date(data.from).toLocaleDateString()} to {new Date(data.to).toLocaleDateString()}
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: data.event, value: data.total_count }]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

