'use client';

import { useEffect, useState } from 'react';
import { api, AttributionResponse } from '@/lib/api';
import { AuthGuard } from '@/components/AuthGuard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

export default function AttributionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AttributionResponse | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAttributionAnalytics();
      setData(result);
    } catch (err) {
      setError('Failed to load attribution data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const installChartData = data?.installs_by_campaign.map((item) => ({
    name: item.campaign_id || 'Unattributed',
    value: item.install_count || 0,
  })) || [];

  const purchaseChartData = data?.purchases_by_campaign.map((item) => ({
    name: item.campaign_id || 'Unattributed',
    value: item.purchase_count || 0,
  })) || [];

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Attribution & Campaign Analytics</h1>
      
      <button
        onClick={loadData}
        className="mb-6 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Refresh Data
      </button>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading attribution data...</div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Installs by Campaign</h3>
              {installChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={installChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {installChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No install data available</p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Purchases by Campaign</h3>
              {purchaseChartData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchaseChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No purchase data available</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Campaign Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Installs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Purchases</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.installs_by_campaign.map((item, index) => {
                    const purchase = data.purchases_by_campaign.find(p => p.campaign_id === item.campaign_id);
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {item.campaign_id || 'Unattributed'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {item.install_count || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {purchase?.purchase_count || 0}
                        </td>
                      </tr>
                    );
                  })}
                  {data.installs_by_campaign.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No campaign data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      </div>
    </AuthGuard>
  );
}

