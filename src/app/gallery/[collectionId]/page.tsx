'use client';

import { useAppStore, MoodboardItem } from '../../store/useAppStore';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, ExternalLink, Star, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Product card component for collection detail view
function MoodboardProductCard({ item }: { item: MoodboardItem }) {
  const [isHovered, setIsHovered] = useState(false);
  const displayUrl = isHovered ? item.imageUrl : item.tryOnUrl;

  return (
    <div 
      className="break-inside-avoid"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 border border-gray-200 overflow-hidden">
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
          <AnimatePresence mode="wait">
            <motion.img
              key={displayUrl}
              src={displayUrl}
              alt={item.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute w-full h-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
              <Heart className="w-4 h-4 text-gray-700 hover:text-black transition-colors" />
            </button>
            <a 
              href={item.buyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
            >
              <ExternalLink className="w-4 h-4 text-white" />
            </a>
          </div>

          {item.price && (
            <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-md text-sm font-medium">
              {item.price}
            </div>
          )}

          {item.isPrime && (
            <div className="absolute top-4 left-4 mt-10 bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium">
              prime
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
            {item.name}
          </h3>
          
          {item.rating && item.ratingCount && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-gray-400 fill-gray-400" />
                <span className="text-sm font-medium text-gray-700">{item.rating}</span>
              </div>
              <span className="text-xs text-gray-500">({item.ratingCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              {item.price && (
                <span className="text-lg font-semibold text-black">{item.price}</span>
              )}
              {item.originalPrice && (
                <span className="text-sm text-gray-500 line-through">{item.originalPrice}</span>
              )}
            </div>
            
            <a 
              href={item.buyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Shop
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.collectionId as string;
  const { moodboards } = useAppStore();

  const collection = moodboards.find(board => board.id === collectionId);

  if (!collection) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-light mb-4">Collection not found</h1>
          <Button onClick={() => router.push('/gallery')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Gallery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal background elements */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Crect x='0' y='0' width='1' height='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="relative container mx-auto p-6 md:p-12 pt-24">
        {/* Back button */}
        <div className="mb-8">
          <Button 
            onClick={() => router.push('/gallery')} 
            variant="ghost" 
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Collections
          </Button>
        </div>

        {/* Collection header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light mb-6 text-black tracking-tight">
            {collection.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light mb-8">
            {collection.description}
          </p>
          <div className="inline-flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
            <span className="text-sm text-gray-600">{collection.items.length} items</span>
          </div>
          <div className="w-16 h-px bg-black mx-auto mt-8"></div>
        </div>

        {/* Products masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {collection.items.map((item) => (
            <MoodboardProductCard key={item.id} item={item} />
          ))}
        </div>

        {/* Collection footer */}
        <div className="text-center mt-20">
          <div className="bg-gray-50 rounded-2xl p-12 border border-gray-200">
            <h3 className="text-3xl font-light mb-4 text-black">
              Love this collection?
            </h3>
            <p className="text-gray-600 mb-6 text-lg font-light">
              Chat with Chad to discover similar pieces or create a new collection
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={() => router.push('/chat')} 
                className="bg-black hover:bg-gray-800 text-white"
              >
                Continue Shopping
              </Button>
              <Button 
                onClick={() => router.push('/gallery')} 
                variant="outline"
              >
                View All Collections
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}