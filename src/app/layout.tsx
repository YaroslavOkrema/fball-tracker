import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@/global.css';

export const metadata: Metadata = {
  title: 'Football Tracker',
  description: 'Football Tracker web application.',
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
