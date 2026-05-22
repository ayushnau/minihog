'use client';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="mh-landing">
      <nav>
        <Link href="/" className="brand" style={{ textDecoration: 'none' }}>
          <span className="mark">▣</span>
          <span style={{ letterSpacing: '.04em' }}>MINIHOG</span>
          <span className="mh-dim" style={{ marginLeft: 8, fontSize: 11 }}>v1.0.0</span>
        </Link>
        <div className="links">
          <button className="mh-btn ghost" onClick={() => {}}>docs</button>
          {user ? (
            <Link href="/dashboard" className="mh-btn primary">Open Dashboard →</Link>
          ) : (
            <>
              <Link href="/signin" className="mh-btn ghost">Sign In</Link>
              <Link href="/signin" className="mh-btn primary">Get Started →</Link>
            </>
          )}
        </div>
      </nav>

      <section className="mh-hero">
        <div>
          <div className="ko">product analytics · self-hosted · open core</div>
          <h1>
            Track your product<br/>
            without<br/>
            the<span style={{ color: 'var(--acc)' }}> bullsh*t</span><span className="blink" />
          </h1>
          <p className="lead">
            MiniHog is the analytics console you'd actually run yourself. Events, funnels, retention, attribution — all the building blocks of a product team's dashboard, none of the dark patterns.
          </p>
          <div className="ctas">
            <Link href="/signin" className="mh-btn primary lg">Create workspace →</Link>
            <Link href={user ? '/dashboard' : '/signin'} className="mh-btn ghost lg">See a live demo</Link>
          </div>
          <div className="mh-row" style={{ marginTop: 24, gap: 22, fontSize: 11.5, color: 'var(--fg-3)' }}>
            <span><span className="mh-acc">✓</span> open source (MIT)</span>
            <span><span className="mh-acc">✓</span> self-host or cloud</span>
            <span><span className="mh-acc">✓</span> SDK in 6 languages</span>
          </div>
        </div>

        <div className="mh-terminal">
          <div className="ttab">
            <div className="dots"><span /><span /><span /></div>
            <span style={{ marginLeft: 8 }}>~/minihog — cli</span>
            <span style={{ marginLeft: 'auto', color: 'var(--acc)' }}>● live</span>
          </div>
          <pre>{'$ minihog status\n\n  workspace   minihog-prod    region us-east-1\n  events 24h  '}<span style={{ color: 'var(--acc)' }}>38,410</span>{'        p95 lag '}<span style={{ color: 'var(--acc)' }}>142 ms</span>{'\n  ingest      '}<span style={{ color: 'var(--info)' }}>▁▂▃▅▆▇█▇▆▅▆▇█▇▅▄▃▅▆▇</span>{'\n\n$ minihog funnel install→signup→purchase\n  install   '}<span style={{ color: 'var(--acc)' }}>████████████████</span>{' 8,120\n  signup    '}<span style={{ color: 'var(--acc)' }}>███████████</span>{'      5,842  '}<span style={{ color: 'var(--fg-3)' }}>(72%)</span>{'\n  purchase  '}<span style={{ color: 'var(--acc)' }}>██</span>{'               1,204  '}<span style={{ color: 'var(--fg-3)' }}>(15%)</span>{'\n\n$ _'}<span style={{ background: 'var(--acc)', width: '.55em', height: '1em', display: 'inline-block', verticalAlign: '-.12em' }} /></pre>
        </div>
      </section>

      <div className="mh-features">
        {[
          { ix: '01', glyph: '⊟', title: 'Event tracking', desc: 'One SDK call, any property bag. Schema-less ingest, typed downstream.' },
          { ix: '02', glyph: '◫', title: 'Real-time analytics', desc: 'Sub-second from event → chart. Time series, funnels, retention.' },
          { ix: '03', glyph: '↬', title: 'Attribution', desc: 'Native UTM + custom claims. Last-click with configurable lookback.' },
          { ix: '04', glyph: '⌬', title: 'Easy integration', desc: 'JS, Swift, Kotlin, Python, Go — SDK in 6 languages.' },
        ].map(f => (
          <div key={f.ix} className="card">
            <div className="ix">▸ {f.ix}</div>
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
            <div className="gl">{f.glyph}</div>
          </div>
        ))}
      </div>

      <div className="mh-ascii-hr" style={{ margin: '0 0 20px' }}>
        <span>├</span><span className="lbl">quick start</span><div className="line" /><span>┤</span>
      </div>

      <div className="mh-quickstart">
        {[
          { ix: '$1', title: 'Install', code: '$ npm i @minihog/sdk\n# or: pip install minihog\n# or: cargo add minihog' },
          { ix: '$2', title: 'Init', code: 'import { Minihog } from "@minihog/sdk";\n\nconst mh = new Minihog({\n  apiKey: process.env.MINIHOG_KEY,\n});' },
          { ix: '$3', title: 'Track', code: 'mh.track("purchase", {\n  user_id: user.id,\n  plan: "premium",\n  amount: 79.99,\n});' },
        ].map(s => (
          <div key={s.ix} className="step">
            <div className="ix">{s.ix}</div>
            <h5>{s.title}</h5>
            <pre>{s.code}</pre>
          </div>
        ))}
      </div>

      <div className="mh-panel" style={{ padding: 36, textAlign: 'center', margin: '0 0 60px' }}>
        <div className="mh-panel-body" style={{ padding: 0 }}>
          <div style={{ fontSize: 11, color: 'var(--fg-3)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 14 }}>$ minihog init</div>
          <div style={{ fontSize: 24, color: 'var(--fg-hi)', fontWeight: 700, marginBottom: 14 }}>Free until your 10 millionth event.</div>
          <div className="mh-row" style={{ justifyContent: 'center', gap: 10 }}>
            <Link href="/signin" className="mh-btn primary lg">Generate API key →</Link>
            <Link href={user ? '/dashboard' : '/signin'} className="mh-btn ghost lg">Tour the dashboard</Link>
          </div>
        </div>
      </div>

      <footer style={{ padding: '20px 0', borderTop: '1px solid var(--bd)', color: 'var(--fg-3)', fontSize: 11.5, display: 'flex', justifyContent: 'space-between' }}>
        <span>© 2026 minihog · MIT licensed</span>
        <span>built with █ · v1.0.0</span>
      </footer>
    </div>
  );
}
