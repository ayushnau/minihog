'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
// Icons will be inline SVG

interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  key?: string; // Only shown once when created
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/keys');
      if (response.ok) {
        const data = await response.json();
        setKeys(data.keys || []);
      } else {
        setError('Failed to load API keys');
      }
    } catch (err) {
      setError('Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a name for the API key');
      return;
    }

    setError('');
    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });

      const data = await response.json();
      if (response.ok) {
        setNewKey(data.key);
        setShowNewKey(true);
        setNewKeyName('');
        loadKeys();
      } else {
        setError(data.error || 'Failed to generate API key. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate API key. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This will permanently remove the key and any applications using it will stop working. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/keys?id=${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadKeys();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to revoke API key');
      }
    } catch (err: any) {
      setError('Failed to revoke API key');
    }
  };

  const revokeAllKeys = async () => {
    if (!confirm('Are you sure you want to revoke ALL API keys? This will permanently remove all keys and any applications using them will stop working. This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/keys?all=true', {
        method: 'DELETE',
      });

      if (response.ok) {
        loadKeys();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to revoke API keys');
      }
    } catch (err: any) {
      setError('Failed to revoke API keys');
    }
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">API Keys</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        {showNewKey && newKey && (
          <div className="mb-6 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-green-900 dark:text-green-200">
              API Key Generated!
            </h3>
            <p className="text-sm text-green-800 dark:text-green-300 mb-4">
              Copy this key now. You won't be able to see it again.
            </p>
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700">
              <code className="flex-1 text-sm font-mono text-gray-900 dark:text-white">{newKey}</code>
              <button
                onClick={() => copyToClipboard(newKey)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={() => {
                setShowNewKey(false);
                setNewKey('');
              }}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              I've copied the key
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Generate New API Key</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Enter key name (e.g., Production, Development)"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={generateKey}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Generate</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your API Keys</h2>
            {keys.length > 0 && (
              <button
                onClick={revokeAllKeys}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span>Revoke All</span>
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No API keys yet. Generate your first key above.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {keys.map((key) => (
                <div key={key.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{key.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                      title="Revoke API key"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <span>Revoke Key</span>
                    </button>
                  </div>
                  {key.key && (
                    <div className="flex items-center gap-4 mt-2">
                      <code className="flex-1 block text-sm font-mono bg-gray-100 dark:bg-gray-900 px-3 py-2 rounded text-gray-900 dark:text-white break-all">
                        {key.key}
                      </code>
                      <div className="w-[120px] flex-shrink-0"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

