'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { DarkModeToggle } from './DarkModeToggle';

const navItems = [
  { href: '/', label: 'Documentation' },
  { href: '/dashboard', label: 'Overview' },
  { href: '/events', label: 'Events' },
  { href: '/funnel', label: 'Funnel' },
  { href: '/retention', label: 'Retention' },
  { href: '/attribution', label: 'Attribution' },
  { href: '/keys', label: 'API Keys' },
  { href: '/settings', label: 'Settings' },
];

export function Navigation() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const isPublicPage = pathname === '/signin';

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isPublicPage) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              MiniHog
            </Link>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.username}
                </span>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <Link
                href="/signin"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              MiniHog
            </Link>
            <div className="flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            {!loading && user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden md:block">
                    {user.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            {!loading && !user && (
              <Link
                href="/signin"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

