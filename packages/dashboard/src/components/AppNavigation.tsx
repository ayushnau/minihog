'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useState } from 'react';
import {
  BarChart3,
  Activity,
  Filter,
  Users,
  // Target,
  Key,
  Settings,
  LogOut,
  Menu,
  X,
  Flame,
} from 'lucide-react';

const navLinks = [
  { to: '/dashboard', label: 'Overview', icon: BarChart3 },
  { to: '/events', label: 'Events', icon: Activity },
  { to: '/funnel', label: 'Funnel', icon: Filter },
  { to: '/retention', label: 'Retention', icon: Users },
  // { to: '/attribution', label: 'Attribution', icon: Target }, // TODO: Attribution not yet implemented in SDK
  { to: '/keys', label: 'API Keys', icon: Key },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const AppNavigation = () => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border z-30">
        <div className="flex items-center gap-2 px-5 h-14 border-b border-sidebar-border">
          <Flame className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground tracking-tight">MiniHog</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                href={to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="px-3 py-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-3 mb-3">
              <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                {user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 w-full text-sm text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground">MiniHog</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="w-64 h-full bg-sidebar border-r border-sidebar-border pt-14 animate-slide-in-left" onClick={e => e.stopPropagation()}>
            <nav className="px-3 py-4 space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => {
                const active = pathname === to;
                return (
                  <Link
                    key={to}
                    href={to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? 'bg-sidebar-accent text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                );
              })}
            </nav>
            {user && (
              <div className="px-3 py-4 border-t border-sidebar-border">
                <p className="px-3 text-sm font-medium text-foreground">{user.username}</p>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 mt-2 w-full text-sm text-muted-foreground hover:text-destructive rounded-md"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AppNavigation;
