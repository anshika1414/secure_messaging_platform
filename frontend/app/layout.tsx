import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal Desktop | Secure Messaging Platform',
  description: 'Full-stack Signal clone platform built with Next.js, FastAPI, SQLite WAL, and WebSockets.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-signal-light dark:bg-signal-dark text-gray-900 dark:text-gray-100">
        {children}
      </body>
    </html>
  );
}
