'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useState, useEffect } from 'react';
import TweaksPanel from './TweaksPanel';

const NAV_ANALYTICS = [
  { id: 'dashboard',   label: 'Overview',     glyph: '◫', href: '/dashboard',   kbd: 'g d' },
  { id: 'events',      label: 'Events',       glyph: '⊟', href: '/events',      kbd: 'g e' },
  { id: 'funnel',      label: 'Funnel',       glyph: '⌇', href: '/funnel',      kbd: 'g f' },
  { id: 'retention',   label: 'Retention',    glyph: '⌗', href: '/retention',   kbd: 'g r' },
  // Attribution (mobile install tracking — not applicable for web SDK merchants, commented until web attribution is built)
  // { id: 'attribution', label: 'Attribution',  glyph: '↬', href: '/attribution', kbd: 'g a' },
];
const NAV_WORKSPACE = [
  { id: 'keys',     label: 'API Keys',  glyph: '⌬', href: '/keys',     kbd: 'g k' },
  { id: 'settings', label: 'Settings',  glyph: '⚙', href: '/settings', kbd: 'g s' },
];

export default function AppNavigation() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [now, setNow] = useState('');

  useEffect(() => {
    const tick = () => setNow(new Date().toUTCString().slice(17, 25));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const currentRoute = pathname.split('/').filter(Boolean)[0] || 'dashboard';

  const SidebarLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      <div className="nav-head">Analytics</div>
      {NAV_ANALYTICS.map((n) => (
        <Link key={n.id} href={n.href}
          className={`nav-item${pathname === n.href ? ' active' : ''}`}
          onClick={onNavigate}>
          <span className="glyph">{n.glyph}</span>
          <span>{n.label}</span>
          <span className="nav-kbd">{n.kbd}</span>
        </Link>
      ))}
      <div className="nav-head">Workspace</div>
      {NAV_WORKSPACE.map((n) => (
        <Link key={n.id} href={n.href}
          className={`nav-item${pathname === n.href ? ' active' : ''}`}
          onClick={onNavigate}>
          <span className="glyph">{n.glyph}</span>
          <span>{n.label}</span>
          <span className="nav-kbd">{n.kbd}</span>
        </Link>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="mh-sidebar" id="mh-sidebar-desktop">
        <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
          <div className="mark">▣</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="name">MINIHOG</span>
            <span className="ver">v1.0.0 · workspace</span>
          </div>
        </Link>
        <nav>
          <SidebarLinks />
        </nav>
        {user && (
          <div className="mh-me">
            <div className="avatar">{user.username[0].toUpperCase()}</div>
            <div className="who">
              <b>{user.username}</b>
              <span>{user.email}</span>
            </div>
            <button className="signout-btn" title="Sign out" onClick={logout}>⏻</button>
          </div>
        )}
      </aside>

      {/* Mobile topbar */}
      <header className="mh-topbar" id="mh-topbar-mobile">
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
          <div className="mark">▣</div>
          <span style={{ color: 'var(--fg-hi)', fontWeight: 700 }}>MINIHOG</span>
        </Link>
        <span className="mh-dim" style={{ marginLeft: 8, fontSize: 11 }}>/{currentRoute}</span>
        <button className="mh-btn ghost sm" style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: 11 }}
          onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? '×' : '≡'}
        </button>
      </header>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9980, background: 'rgba(0,0,0,.6)' }}
          onClick={() => setMobileOpen(false)}>
          <div style={{ width: 260, height: '100%', background: 'var(--bg-1)', borderRight: '1px solid var(--bd)', paddingTop: 44 }}
            onClick={e => e.stopPropagation()}>
            <nav style={{ padding: '8px 6px' }}>
              <SidebarLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
            {user && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid var(--bd)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, border: '1px solid var(--acc-bd)', background: 'var(--acc-soft)', color: 'var(--acc)', display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                  {user.username[0].toUpperCase()}
                </div>
                <span style={{ color: 'var(--fg-hi)', fontSize: 12 }}>{user.username}</span>
                <button className="mh-btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => { logout(); setMobileOpen(false); }}>⏻</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status bar */}
      <footer className="mh-statusbar">
        <span><span className="s-dot" /><span className="s-acc">CONNECTED</span></span>
        <span>
          <span className="mh-dim">~/minihog</span>{' '}
          <span style={{ color: 'var(--acc)' }}>/{currentRoute}</span>{' '}
          <span className="mh-dim">· ingest </span><span className="s-acc">live</span>
        </span>
        <span />
        <TweaksPanel />
        <span className="s-acc mh-tabnum">{now} UTC</span>
      </footer>

    </>
  );
}
