import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Flame, BarChart3, Activity, Zap, Code, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: Activity, title: 'Event Tracking', desc: 'Track every user interaction with a simple SDK call. Page views, clicks, signups, purchases — all captured.' },
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'See your data update in real-time. Time series, funnels, retention — all at your fingertips.' },
  { icon: Zap, title: 'Attribution', desc: 'Understand which campaigns drive installs and purchases with last-click attribution.' },
  { icon: Code, title: 'Easy Integration', desc: 'Drop in our JavaScript SDK with a single init call. Track events in under 5 minutes.' },
];

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">MiniHog</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
            ) : (
              <Link to="/signin">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="relative max-w-4xl mx-auto px-4 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-secondary text-xs text-muted-foreground mb-6">
            <Flame className="h-3 w-3 text-primary" />
            Open-source product analytics
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            <span className="text-gradient">MiniHog</span> Analytics
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Lightweight, self-hosted product analytics. Track events, analyze funnels, measure retention, and attribute campaigns — all in one dashboard.
          </p>
          <Link to="/signin">
            <Button size="lg" className="gradient-primary border-0 text-primary-foreground glow-sm">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Everything you need</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border bg-card p-6 hover:border-primary/30 transition-colors animate-slide-up">
                <Icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Quick Start</h2>
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">1. Install the SDK</h3>
              <pre className="bg-secondary rounded-md p-4 text-sm font-mono text-secondary-foreground overflow-x-auto">
                npm install minihog-sdk
              </pre>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">2. Initialize</h3>
              <pre className="bg-secondary rounded-md p-4 text-sm font-mono text-secondary-foreground overflow-x-auto">
{`import MiniHog from 'minihog-sdk';

MiniHog.init({
  apiKey: 'your-api-key',
  apiUrl: 'https://your-api.com'
});`}
              </pre>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-3">3. Track Events</h3>
              <pre className="bg-secondary rounded-md p-4 text-sm font-mono text-secondary-foreground overflow-x-auto">
{`MiniHog.track('signup', {
  plan: 'pro',
  source: 'landing_page'
});`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-6">Generate an API key and start tracking in under 5 minutes.</p>
          <Link to="/signin">
            <Button size="lg" className="gradient-primary border-0 text-primary-foreground">
              Generate API Key <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          MiniHog Analytics · Open-source product analytics
        </div>
      </footer>
    </div>
  );
};

export default Landing;
