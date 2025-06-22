'use client'; // This needs to be a client component to use hooks

// useEffect import removed since we no longer need it
import { useAppStore } from './store/useAppStore';
import './globals.css';
import { Inter } from 'next/font/google';
import { FloatingNav } from '@/components/aceternity/floating-nav';
import { FashionLoading } from '@/components/fashion-loading';
import { Home, Bot, Image, GalleryHorizontal } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We no longer need to load the product catalog here.
  const isLoading = useAppStore((state) => state.isLoading);

  // The useEffect for loadProductCatalog has been removed.

  const navItems = [
    { name: "Home", link: "/", icon: <Home className="h-4 w-4 text-neutral-500 dark:text-white" /> },
    { name: "My Model", link: "/onboarding", icon: <Image className="h-4 w-4 text-neutral-500 dark:text-white" /> },
    { name: "Chat", link: "/chat", icon: <Bot className="h-4 w-4 text-neutral-500 dark:text-white" /> },
    { name: "Gallery", link: "/gallery", icon: <GalleryHorizontal className="h-4 w-4 text-neutral-500 dark:text-white" /> },
  ];

  return (
    <html lang="en">
      <body className={inter.className}>
        {isLoading && <FashionLoading />}
        
        <FloatingNav navItems={navItems} />
        
        <main>{children}</main>
      </body>
    </html>
  );
}
