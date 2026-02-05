import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MiniHog SDK Test App',
  description: 'Test application for MiniHog SDK development',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

