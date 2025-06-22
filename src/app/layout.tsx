'use client'; // This needs to be a client component to use hooks

// useEffect import removed since we no longer need it
import { useAppStore } from './store/useAppStore';
import './globals.css';
import { Poppins } from 'next/font/google';
import { FashionLoading } from '@/components/fashion-loading';
import { Toaster } from 'react-hot-toast';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // We no longer need to load the product catalog here.
  const isLoading = useAppStore((state) => state.isLoading);

  // The useEffect for loadProductCatalog has been removed.

  return (
    <html lang="en">
      <body className={poppins.className}>
        {isLoading && <FashionLoading />}
        
        <Toaster 
          position="bottom-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#1f2937',
              color: '#ffffff',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '14px',
              fontWeight: '500',
              minWidth: '320px',
              maxWidth: '500px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#10b981',
              },
            },
            error: {
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
              },
              iconTheme: {
                primary: '#ffffff',
                secondary: '#ef4444',
              },
            },
          }}
        />
        
        <main>{children}</main>
      </body>
    </html>
  );
}
