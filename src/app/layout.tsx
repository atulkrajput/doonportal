import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Navbar from '@/components/layouts/Navbar';
import Footer from '@/components/layouts/Footer';
import WhatsAppFloat from '@/components/ui/WhatsAppFloat';
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://doonportal.com'),
  title: {
    default: 'DoonPortal - Automation Software for Schools, Retail & Dairy',
    template: '%s | DoonPortal Automation Software',
  },
  description:
    'Automation software for schools and businesses. Manage operations with School ERP, Inventory POS, and Dairy Management systems.',
  keywords: [
    'automation software',
    'school management software',
    'school ERP software',
    'inventory POS',
    'dairy management software',
    'business automation India',
  ],
  authors: [{ name: 'DoonPortal' }],
  creator: 'DoonPortal',
  publisher: 'DoonPortal',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://doonportal.com',
    siteName: 'DoonPortal',
    title: 'DoonPortal - Automation Software for Schools, Retail & Dairy',
    description:
      'Automation software for schools and businesses. Manage operations with School ERP, Inventory POS, and Dairy Management systems.',
    images: [
      {
        url: '/images/og/home.png',
        width: 1200,
        height: 630,
        alt: 'DoonPortal Automation Software',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@doonportal',
    creator: '@doonportal',
    title: 'DoonPortal - Automation Software for Schools, Retail & Dairy',
    description:
      'Automation software for schools and businesses. Manage operations with School ERP, Inventory POS, and Dairy Management systems.',
    images: ['/images/og/home.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://doonportal.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AnalyticsProvider />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
