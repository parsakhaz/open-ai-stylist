'use client'; // This needs to be a client component to use hooks

import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import './globals.css';
import { Inter } from 'next/font/google';
import { FloatingNav } from '@/components/aceternity/floating-nav';
import { Home, Bot, Image, GalleryHorizontal } from 'lucide-react';

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

  const navItems = [
    { name: "Home", link: "/", icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" /> },
    { name: "My Model", link: "/onboarding", icon: <Image className="h-4 w-4 text-neutral-500 dark:text-white" /> },
    { name: "Chat", link: "/chat", icon: <Bot className="h-4 w-4 text-neutral-500 dark:text-white" /> },
    { name: "Gallery", link: "/gallery", icon: <GalleryHorizontal className="h-4 w-4 text-neutral-500 dark:text-white" /> },
  ];

  return (
    <html lang="en">
      <body className={inter.className}>
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="text-white text-xl animate-pulse">Generating Style...</div>
          </div>
        )}
        
        <FloatingNav navItems={navItems} />
        
        <main>{children}</main>
      </body>
    </html>
  );
}
