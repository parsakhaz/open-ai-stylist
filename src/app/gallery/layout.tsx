import { GallerySidebar } from '@/components/gallery-sidebar';

export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-25 to-purple-50 animate-gradient bg-[length:400%_400%]"></div>
      
      <GallerySidebar />
      <main className="flex-1 relative z-10 overflow-y-auto">{children}</main>
    </div>
  );
}