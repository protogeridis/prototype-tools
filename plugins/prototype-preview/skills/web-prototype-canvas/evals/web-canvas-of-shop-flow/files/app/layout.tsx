import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = { title: 'Corner Shop' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <Link href="/">Corner Shop</Link>
          <span>Free delivery over £30</span>
        </header>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
