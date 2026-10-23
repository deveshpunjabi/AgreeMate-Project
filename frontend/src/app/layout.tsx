import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit, JetBrains_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-display-next',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body-next',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-mono-next',
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif-next',
  display: 'swap',
  style: ['normal', 'italic']
});

import QueryProvider from '@/components/providers/QueryProvider';
import { ToastProvider } from '@/components/ui/Toast';
import LoadingScreen from '@/components/ui/LoadingScreen';

export const metadata: Metadata = {
  title: 'AgreeMate — Lend with Trust. Borrow with Proof.',
  description:
    'The first mutual-consent lending platform with tamper-proof SHA-256 evidence, automated penalties, and dispute-ready legal exports. Free forever.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        url: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        url: '/favicon-16x16.png',
      },
    ],
  },
  keywords: [
    'lending platform',
    'mutual consent',
    'SHA-256 evidence',
    'item lending',
    'agreement management',
    'dispute resolution',
  ],
  openGraph: {
    title: 'AgreeMate — Lend with Trust. Borrow with Proof.',
    description:
      'The first mutual-consent lending platform with tamper-proof evidence and automated penalties.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'AgreeMate',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgreeMate — Lend with Trust. Borrow with Proof.',
    description:
      'Mutual-consent lending with SHA-256 evidence and auto penalties.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} antialiased`}>
      <head>
        {/* Preload critical lightweight visual assets */}
        <link rel="preload" href="/apple-touch-icon.png" as="image" />
        <link rel="preload" href="/video/background-poster.webp" as="image" type="image/webp" />
      </head>
      <body className="min-h-full flex flex-col bg-canvas text-ink font-body relative">
        <LoadingScreen />
        <QueryProvider>
          <ToastProvider>
            <div className="relative z-10 min-h-full flex flex-col">
              {children}
            </div>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
