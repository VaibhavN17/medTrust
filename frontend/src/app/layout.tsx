import type { Metadata } from 'next';
import { Outfit, Playfair_Display } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MedTrust — Transparent Medical Fundraising',
  description: 'Where every rupee donated is accounted for. Support verified medical campaigns and track exactly how your contribution helps.',
  keywords: ['medical fundraising', 'donation', 'healthcare', 'transparent', 'India'],
  openGraph: {
    title: 'MedTrust — Transparent Medical Fundraising',
    description: 'Support verified medical campaigns with full transparency',
    siteName: 'MedTrust',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-slate-50 text-slate-900">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#14b8a6', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </body>
    </html>
  );
}
