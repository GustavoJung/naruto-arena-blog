import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// import Navbar from '@/components/Navbar'; // Replaced by Sidebar

export const metadata: Metadata = {
  title: 'Pergaminho Ninja - Naruto Arena',
  description: 'Descubra as melhores composições de times para o Naruto Arena.',
};

import { Kanit, Inter } from 'next/font/google';
import Sidebar from '@/components/Sidebar';

const kanit = Kanit({
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-kanit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${kanit.variable} ${inter.variable}`}>
        <Providers>
          <div className="layout-root">
            <Sidebar />
            <main className="main-content">
              <div className="container">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
