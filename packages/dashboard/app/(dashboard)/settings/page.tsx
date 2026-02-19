'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getDefaultDateRange, setDefaultDateRange, type DefaultDateRange } from '@/lib/settings';

export default function SettingsPage() {
  const { user, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const [defaultDays, setDefaultDays] = useState<DefaultDateRange>('7');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  useEffect(() => {
    if (mounted) setDefaultDays(getDefaultDateRange());
  }, [mounted]);

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess(false);
    setEmailSaving(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmailSuccess(true);
        refresh();
      } else {
        setEmailError(data.error || 'Failed to update email');
      }
    } catch {
      setEmailError('Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch {
      setPasswordError('Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDefaultDateRange = (value: DefaultDateRange) => {
    setDefaultDays(value);
    setDefaultDateRange(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Profile */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-1">Email</label>
            <form onSubmit={handleSaveEmail} className="flex flex-wrap items-end gap-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="max-w-xs"
                placeholder="you@example.com"
              />
              <Button type="submit" disabled={emailSaving}>
                {emailSaving ? 'Saving…' : 'Save email'}
              </Button>
            </form>
            {user?.username && (
              <p className="text-xs text-muted-foreground mt-1">Username: {user.username}</p>
            )}
            {emailError && <p className="text-sm text-destructive mt-1">{emailError}</p>}
            {emailSuccess && <p className="text-sm text-success mt-1">Email updated.</p>}
          </div>

          <div className="pt-4 border-t border-border">
            <label className="text-sm text-muted-foreground block mb-2">Change password</label>
            <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                required
              />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                required
                minLength={8}
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
              <Button type="submit" disabled={passwordSaving}>
                {passwordSaving ? 'Saving…' : 'Change password'}
              </Button>
            </form>
            {passwordError && <p className="text-sm text-destructive mt-1">{passwordError}</p>}
            {passwordSuccess && <p className="text-sm text-success mt-1">Password updated.</p>}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Preferences</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Theme</label>
            <select
              value={mounted ? theme ?? 'dark' : 'dark'}
              onChange={(e) => setTheme(e.target.value)}
              className="h-9 px-3 rounded-md bg-secondary text-secondary-foreground border border-border text-sm"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground block mb-2">Default date range</label>
            <p className="text-xs text-muted-foreground mb-2">
              Default range when opening Overview or Events (e.g. Last 7 days).
            </p>
            <select
              value={defaultDays}
              onChange={(e) => handleDefaultDateRange(e.target.value as DefaultDateRange)}
              className="h-9 px-3 rounded-md bg-secondary text-secondary-foreground border border-border text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">About</h2>
        <div className="space-y-2 text-sm">
          <p className="font-medium text-foreground">MiniHog Dashboard</p>
          <p className="text-muted-foreground">Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
}
