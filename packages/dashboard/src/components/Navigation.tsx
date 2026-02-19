'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change (e.g. after clicking a link)
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setMobileMenuOpen(false);
  };

  if (isPublicPage) {
    return (
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
              MiniHog
            </Link>
            <div className="flex items-center gap-3 sm:gap-4">
              <DarkModeToggle />
              {user ? (
                <div className="flex items-center gap-2 sm:gap-4">
                  <span className="text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                    {user.username}
                  </span>
                  <Link
                    href="/dashboard"
                    className="px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <Link
                  href="/signin"
                  className="px-3 py-2 sm:px-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
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
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-4 md:gap-8">
            <Link href="/" className="text-lg sm:text-xl font-bold text-primary-600 dark:text-primary-400 shrink-0">
              MiniHog
            </Link>
            {/* Desktop nav: visible from md up */}
            <div className="hidden md:flex space-x-1">
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

          <div className="flex items-center gap-2 sm:gap-4">
            <DarkModeToggle />
            {!loading && user && (
              <div className="hidden sm:flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2">
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
                className="hidden sm:inline-flex px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu button: visible only below md */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown: visible when open, below md */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-lg max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="container mx-auto px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {/* User section in mobile menu */}
            {!loading && user && (
              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-2">
                <div className="flex items-center gap-2 px-4 py-2">
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
            {!loading && !user && (
              <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  href="/signin"
                  className="block px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium text-center"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

