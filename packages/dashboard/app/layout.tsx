import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MiniHog Dashboard',
  description: 'Self-hosted product analytics — events, funnels, retention, attribution.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Restore theme/accent before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('mh-theme');
              var a = localStorage.getItem('mh-accent');
              if (t === 'light') document.documentElement.setAttribute('data-theme','light');
              if (a) document.documentElement.setAttribute('data-accent', a);
            } catch(e){}
          })();
        ` }} />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
