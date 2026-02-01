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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API URL
              </label>
              <input
                type="text"
                value={apiUrl}
                readOnly
                className="w-full border rounded px-3 py-2 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Configure via NEXT_PUBLIC_API_URL environment variable
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Status
              </label>
              <div className="flex items-center space-x-2">
                {healthStatus === 'checking' && (
                  <>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Checking...</span>
                  </>
                )}
                {healthStatus === 'healthy' && (
                  <>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-green-600">Connected</span>
                  </>
                )}
                {healthStatus === 'error' && (
                  <>
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span className="text-sm text-red-600">Connection Failed</span>
                  </>
                )}
                <button
                  onClick={checkHealth}
                  className="ml-4 px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>MiniHog Dashboard</strong> - Analytics visualization for MiniHog</p>
            <p>Version: 1.0.0</p>
            <p>Backend API: {apiUrl}</p>
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}

