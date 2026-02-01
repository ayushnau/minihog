'use client';

import { useEffect, useState } from 'react';
import { LoginModal } from './LoginModal';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [showLogin, setShowLogin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      setShowLogin(true);
    }
  }, [user, loading]);

  const handleLoginSuccess = () => {
    checkAuth();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginModal 
          isOpen={showLogin} 
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Please sign in to continue</p>
            <button
              onClick={() => setShowLogin(true)}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </>
    );
  }

  return <>{children}</>;
}

