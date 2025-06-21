'use client'; // This needs to be a client component to use hooks

import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import './globals.css';
import Link from 'next/link';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const loadProductCatalog = useAppStore((state) => state.loadProductCatalog);
  const isLoading = useAppStore((state) => state.isLoading);

  useEffect(() => {
    loadProductCatalog();
  }, [loadProductCatalog]);

  return (
    <html lang="en">
      <body className={inter.className}>
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="text-white text-xl animate-pulse">Generating Style...</div>
          </div>
        )}
        <nav className="bg-white border-b p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="font-bold text-xl">AI Fashion</Link>
            <div className="space-x-4">
              <Link href="/onboarding" className="text-gray-600 hover:text-indigo-600">My Model</Link>
              <Link href="/chat" className="text-gray-600 hover:text-indigo-600">Chat</Link>
              <Link href="/gallery" className="text-gray-600 hover:text-indigo-600">Gallery</Link>
            </div>
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
