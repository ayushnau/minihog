'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AuthGuard } from '@/components/AuthGuard';

export default function SettingsPage() {
  const [apiUrl, setApiUrl] = useState('');
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'error'>('checking');

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    setApiUrl(url);
    checkHealth();
  }, []);

  const checkHealth = async () => {
    setHealthStatus('checking');
    try {
      await api.healthCheck();
      setHealthStatus('healthy');
    } catch (err) {
      setHealthStatus('error');
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-gray-900 dark:text-white">Settings</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={apiUrl}
                readOnly
                className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Configure via NEXT_PUBLIC_API_URL environment variable
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Connection Status
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {healthStatus === 'checking' && (
                  <>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Checking...</span>
                  </>
                )}
                {healthStatus === 'healthy' && (
                  <>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-600 dark:text-green-400">Connected</span>
                  </>
                )}
                {healthStatus === 'error' && (
                  <>
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-sm text-red-600 dark:text-red-400">Connection Failed</span>
                  </>
                )}
                <button
                  onClick={checkHealth}
                  className="px-3 py-2 sm:py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 min-h-[44px] sm:min-h-0"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">About</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p><strong className="text-gray-900 dark:text-white">MiniHog Dashboard</strong> - Analytics visualization for MiniHog</p>
            <p>Version: 1.0.0</p>
            <p>Backend API: {apiUrl}</p>
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}

