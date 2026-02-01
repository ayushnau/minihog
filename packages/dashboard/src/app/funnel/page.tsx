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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Funnel Analysis</h1>
      
      <DateRangePicker onDateChange={handleDateChange} />
      
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <label className="text-sm font-medium text-gray-700 mr-4">Funnel Steps (comma-separated):</label>
        <input
          type="text"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          placeholder="e.g., install,signup,purchase"
          className="border rounded px-3 py-1 text-sm flex-1 min-w-[300px]"
        />
        <button
          onClick={loadData}
          className="ml-4 px-4 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700"
        >
          Analyze
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading funnel data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Funnel Visualization</h3>
            <p className="text-sm text-gray-500 mb-4">
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

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Funnel Steps</h3>
            <div className="space-y-4">
              {data.funnel.map((step, index) => (
                <div key={step.step} className="flex items-center justify-between p-4 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">
                      Step {step.step}: {step.event_name}
                    </p>
                    {index > 0 && (
                      <p className="text-sm text-red-600">
                        Drop-off: {step.drop_off_percentage.toFixed(2)}%
                      </p>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary-600">
                    {step.users.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

