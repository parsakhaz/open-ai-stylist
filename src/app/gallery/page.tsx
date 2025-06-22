'use client';

import { useAppStore } from '../store/useAppStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Eye, Tag } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Collection card component
function CollectionCard({ board, index }: { board: any; index: number }) {
  const router = useRouter();
  
  // Get first 4 items for preview grid
  const previewItems = board.items.slice(0, 4);
  
  return (
    <div 
      className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden"
      onClick={() => router.push(`/gallery/${board.id}`)}
    >
      {/* Preview grid */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {previewItems.length > 0 ? (
          <div className="grid grid-cols-2 h-full">
            {previewItems.map((item, idx) => (
              <div key={item.id} className="relative overflow-hidden">
                <img 
                  src={item.tryOnUrl || item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {idx === 3 && board.items.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-medium text-sm">+{board.items.length - 4} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300"></div>
        
        {/* View button */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
            <Eye className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        
        {/* Collection number badge */}
        <div className="absolute top-4 left-4">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-gray-200/50">
            <Tag className="w-3 h-3 text-gray-600" />
            <span className="font-medium text-gray-700 text-xs">Collection {index + 1}</span>
          </div>
        </div>
      </div>
      
      {/* Collection info */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2 text-lg group-hover:text-black transition-colors">
          {board.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {board.description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{board.items.length} items</span>
          <span className="text-gray-400 group-hover:text-gray-600 transition-colors">View collection →</span>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const { moodboards } = useAppStore();
  const router = useRouter();

  if (moodboards.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Minimal geometric elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 border border-gray-100 rounded-full opacity-30"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gray-50 rounded-full opacity-50"></div>
        </div>
        
        <div className="relative flex flex-col items-center justify-center h-screen text-center px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-12 shadow-lg">
            <div className="mb-8 relative">
              <div className="w-24 h-24 mx-auto bg-black rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-white" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-black">
              No Collections Yet
            </h1>
            <p className="text-gray-600 mb-8 text-lg max-w-md">
              Start chatting with Chad to discover pieces and create your first collection
            </p>
            <Link href="/chat">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300">
                Start Shopping <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Crect x='0' y='0' width='1' height='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Subtle floating elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-px h-32 bg-gray-200 opacity-50"></div>
        <div className="absolute bottom-1/3 right-1/4 w-32 h-px bg-gray-200 opacity-50"></div>
      </div>

      <div className="relative container mx-auto p-6 md:p-12 pt-24">
        {/* Minimal header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-light mb-6 text-black tracking-tight">
            Collections
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Your curated fashion collections, organized by style
          </p>
          <div className="w-16 h-px bg-black mx-auto mt-8"></div>
        </div>

        {/* Collections grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {moodboards.map((board, boardIndex) => (
            <CollectionCard key={board.id} board={board} index={boardIndex} />
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-20 mb-12">
          <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200">
            <h3 className="text-3xl font-light mb-4 text-black">
              Ready for More?
            </h3>
            <p className="text-gray-600 mb-6 text-lg font-light">
              Chat with Chad to discover new pieces and create more collections
            </p>
            <Link href="/chat">
              <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300">
                Continue Shopping <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 