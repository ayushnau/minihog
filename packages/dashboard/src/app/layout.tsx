import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MiniHog Dashboard',
  description: 'Analytics dashboard for MiniHog',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} bg-gray-50 dark:bg-gray-900 overflow-x-hidden min-h-screen`}>
        <Navigation />
        <main className="min-h-screen pb-safe">
          {children}
        </main>
      </body>
    </html>
  )
}

