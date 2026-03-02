import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
// import Navbar from '@/components/Navbar'; // Replaced by Sidebar

export const metadata: Metadata = {
  title: 'Pergaminho Ninja - Naruto Arena',
  description: 'Descubra as melhores composições de times para o Naruto Arena.',
};

import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import Sidebar from '@/components/Sidebar';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${outfit.variable} ${plusJakartaSans.variable}`}>
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
