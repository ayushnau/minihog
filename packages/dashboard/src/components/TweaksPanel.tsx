'use client';

import { useState, useEffect, useRef } from 'react';

const ACCENTS = [
  { id: 'phosphor', label: 'Phosphor', color: '#4ade80', value: '' },
  { id: 'amber',    label: 'Amber',    color: '#f0b429', value: 'amber' },
  { id: 'magenta',  label: 'Magenta',  color: '#d670d6', value: 'magenta' },
  { id: 'ice',      label: 'Ice',      color: '#7cd4f7', value: 'ice' },
  { id: 'mono',     label: 'Mono',     color: '#e8e8e8', value: 'mono' },
];

const ACCENT_LABELS: Record<string, string> = {
  '': 'green', amber: 'amber', magenta: 'magenta', ice: 'cyan', mono: 'mono',
};

export default function TweaksPanel() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [accent, setAccent] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Read current state from document on mount
  useEffect(() => {
    const theme = document.documentElement.getAttribute('data-theme');
    setDarkMode(theme !== 'light');
    setAccent(document.documentElement.getAttribute('data-accent') || '');
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const toggleDark = (dark: boolean) => {
    if (dark) {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    setDarkMode(dark);
    localStorage.setItem('mh-theme', dark ? '' : 'light');
  };

  const applyAccent = (value: string) => {
    if (value) {
      document.documentElement.setAttribute('data-accent', value);
    } else {
      document.documentElement.removeAttribute('data-accent');
    }
    setAccent(value);
    localStorage.setItem('mh-accent', value);
  };

  return (
    <>
      {/* Trigger button — lives in status bar */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: open ? 'var(--acc)' : 'var(--fg-3)',
          fontFamily: 'var(--mono)', fontSize: 11,
          padding: '0 4px', letterSpacing: '.06em',
          transition: 'color .1s',
        }}
        title="Tweaks (appearance)"
      >
        ⚙ tweaks
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 32, left: 250, zIndex: 9990,
          width: 260,
        }} ref={ref}>
          <div style={{
            background: 'var(--bg-1)',
            border: '1px solid var(--acc-bd)',
            borderRadius: 'var(--rad)',
            boxShadow: '0 8px 32px rgba(0,0,0,.5), 0 0 0 1px var(--bg)',
            fontFamily: 'var(--mono)',
            overflow: 'hidden',
            animation: 'mh-pop .12s ease-out',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px 8px',
              borderBottom: '1px solid var(--bd)',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--fg-hi)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                Tweaks
              </span>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--fg-3)', fontSize: 14, lineHeight: 1, padding: 2,
              }}>×</button>
            </div>

            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* THEME section */}
              <div>
                <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10 }}>
                  Theme
                </div>
                {/* Dark mode toggle */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, color: 'var(--fg)' }}>Dark mode</span>
                  <button
                    onClick={() => toggleDark(!darkMode)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: darkMode ? 'var(--acc)' : 'var(--bg-3)',
                      position: 'relative', transition: 'background .15s', flexShrink: 0,
                    }}
                    aria-label="Toggle dark mode"
                  >
                    <span style={{
                      position: 'absolute', top: 3, left: darkMode ? 18 : 3,
                      width: 14, height: 14, borderRadius: '50%',
                      background: darkMode ? 'var(--bg)' : 'var(--fg-2)',
                      transition: 'left .15s',
                    }} />
                  </button>
                </div>
              </div>

              {/* ACCENT COLOR section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                    Accent Color
                  </div>
                  <span style={{ fontSize: 10.5, color: 'var(--acc)' }}>{ACCENT_LABELS[accent]}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {ACCENTS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => applyAccent(a.value)}
                      title={a.label}
                      style={{
                        width: 32, height: 32, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: a.color,
                        outline: accent === a.value ? `2px solid ${a.color}` : '2px solid transparent',
                        outlineOffset: 2,
                        transition: 'outline .1s, transform .08s',
                        transform: accent === a.value ? 'scale(1.12)' : 'scale(1)',
                        flexShrink: 0,
                      }}
                      aria-label={a.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
