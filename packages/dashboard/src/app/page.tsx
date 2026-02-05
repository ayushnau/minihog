import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            MiniHog Analytics
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Powerful analytics and attribution engine for your applications
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Track events, analyze funnels, measure retention, and attribute installs to campaigns. 
            Built for developers who need reliable analytics without the complexity.
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Get Started
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Everything you need for analytics
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon="BarChart3"
              title="Event Tracking"
              description="Track any event in your application with simple API calls"
            />
            <FeatureCard
              icon="Zap"
              title="Real-time Analytics"
              description="View your data in beautiful dashboards with instant updates"
            />
            <FeatureCard
              icon="Shield"
              title="Attribution"
              description="Understand which campaigns drive installs and conversions"
            />
            <FeatureCard
              icon="Code"
              title="Easy Integration"
              description="Simple JavaScript SDK that works with any framework"
            />
          </div>
        </div>
      </section>

      {/* Documentation Section */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Documentation
          </h2>
          
          <div className="space-y-8">
            <DocSection
              title="Getting Started"
              content={
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    MiniHog is a lightweight analytics backend that helps you track user events, analyze funnels, measure retention, and attribute installs to marketing campaigns.
                  </p>
                  <h4 className="font-semibold text-gray-900 dark:text-white mt-4">Quick Start:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                    <li>Sign up for a free account</li>
                    <li>Generate your API key</li>
                    <li>Install the JavaScript SDK</li>
                    <li>Start tracking events</li>
                  </ol>
                </div>
              }
            />

            <DocSection
              title="JavaScript SDK"
              content={
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Install the MiniHog SDK in your application:
                  </p>
                  <pre className="bg-gray-800 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto">
{`npm install minihog-sdk

import MiniHog from 'minihog-sdk';

MiniHog.init({
  environment: 'production', // 'production' | 'sandbox' | 'development'
  apiKey: 'your-api-key'
});

MiniHog.track('app_open');
MiniHog.track('purchase', { amount: 299 });`}
                  </pre>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    The SDK automatically uses the correct API endpoint based on the environment. 
                    No need to specify the endpoint URL manually.
                  </p>
                </div>
              }
            />

            <DocSection
              title="API Endpoints"
              content={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">POST /track</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Track a user event</p>
                    <pre className="bg-gray-800 dark:bg-gray-950 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "event": "purchase",
  "distinct_id": "user_123",
  "properties": {
    "amount": 299
  }
}`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">POST /click</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Record a marketing click for attribution</p>
                    <pre className="bg-gray-800 dark:bg-gray-950 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "device_id": "device_abc",
  "campaign_id": "INSTAGRAM_12"
}`}
                    </pre>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">POST /install</h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Record an install event (triggers attribution)</p>
                    <pre className="bg-gray-800 dark:bg-gray-950 text-gray-100 p-3 rounded text-sm overflow-x-auto">
{`{
  "device_id": "device_abc"
}`}
                    </pre>
                  </div>
                </div>
              }
            />

            <DocSection
              title="Analytics Queries"
              content={
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /analytics/events</h4>
                    <p className="text-gray-600 dark:text-gray-400">Get event counts and unique users</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Query params: event, from (YYYY-MM-DD), to (YYYY-MM-DD)
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /analytics/funnel</h4>
                    <p className="text-gray-600 dark:text-gray-400">Analyze user progression through steps</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Query params: steps (comma-separated), from, to
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /analytics/retention</h4>
                    <p className="text-gray-600 dark:text-gray-400">Measure user retention over time</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Query params: cohort, day, from, to
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">GET /analytics/attribution</h4>
                    <p className="text-gray-600 dark:text-gray-400">View campaign performance and attribution</p>
                  </div>
                </div>
              }
            />

            <DocSection
              title="Attribution Model"
              content={
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    MiniHog uses <strong>last-click attribution</strong>:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-600 dark:text-gray-400 ml-4">
                    <li>When an install event is recorded, the system looks for clicks from the same device_id</li>
                    <li>Clicks within the attribution window (default: 24 hours) are considered</li>
                    <li>The most recent click's campaign_id is assigned to the install</li>
                    <li>The attributed campaign is stored with the install and subsequent events</li>
                  </ol>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    The attribution window is configurable via <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">ATTRIBUTION_WINDOW_HOURS</code> environment variable.
                  </p>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Ready to get started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Sign up for free and start tracking events in minutes
          </p>
          <Link
            href="/signin"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Generate API Key
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const IconComponent = () => {
    switch(icon) {
      case 'BarChart3':
        return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'Zap':
        return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
      case 'Shield':
        return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
      case 'Code':
        return <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="p-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:shadow-lg transition-shadow">
      <div className="text-primary-600 dark:text-primary-400 mb-4"><IconComponent /></div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

function DocSection({ title, content }: { title: string; content: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>
      <div className="text-gray-700 dark:text-gray-300">
        {content}
      </div>
    </div>
  );
}
