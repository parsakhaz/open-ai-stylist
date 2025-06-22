'use client';

import { useAppStore, MoodboardItem } from '../../store/useAppStore';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, ExternalLink, Star, ShoppingBag, Palette } from 'lucide-react';
import { getMoodboardAccents } from '@/lib/moodboard-backgrounds';
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

export default function MoodboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moodboardId = params.collectionId as string;
  const { moodboards } = useAppStore();

  const moodboard = moodboards.find(board => board.id === moodboardId);
  const { background, accents } = moodboard ? getMoodboardAccents(moodboard.id) : { background: null, accents: [] };

  if (!moodboard) {
    return (
      <div className="min-h-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/90 backdrop-blur-sm border border-white/50 rounded-2xl p-8">
            <h1 className="text-2xl font-light mb-4">Moodboard not found</h1>
            <Button onClick={() => router.push('/gallery')} variant="outline" className="bg-white/50 hover:bg-white/70 border-white/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-full"
      style={{
        backgroundColor: background?.colors[0] ? background.colors[0] + '80' : '#ffffff80',
        backgroundImage: background?.pattern,
      }}
    >
      {/* Dynamic accent elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {accents.map((accent, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${accent.x}%`,
              top: `${accent.y}%`,
              transform: `rotate(${accent.rotation}deg)`,
              opacity: accent.opacity * 0.5,
            }}
          >
            {accent.type === 'circle' && (
              <div 
                className="rounded-full border border-gray-400"
                style={{ width: accent.size * 1.5, height: accent.size * 1.5 }}
              />
            )}
            {accent.type === 'line' && (
              <div 
                className="bg-gray-400"
                style={{ width: accent.size * 1.5, height: 1 }}
              />
            )}
            {accent.type === 'square' && (
              <div 
                className="border border-gray-400"
                style={{ width: accent.size * 1.2, height: accent.size * 1.2 }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="relative container mx-auto p-6 md:p-12 pt-8">
        {/* Back button */}
        <div className="mb-8">
          <Button 
            onClick={() => router.push('/gallery')} 
            variant="ghost" 
            className="bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Moodboards
          </Button>
        </div>

        {/* Moodboard header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/50 mb-6">
            <Palette className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Moodboard</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-light mb-6 text-black tracking-tight">
            {moodboard.title}
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto font-light mb-8">
            {moodboard.description}
          </p>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/50">
            <span className="text-sm text-gray-600">{moodboard.items.length} pieces</span>
          </div>
          <div className="w-16 h-px bg-black mx-auto mt-8"></div>
        </div>

        {/* Products masonry grid */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {moodboard.items.map((item) => (
            <MoodboardProductCard key={item.id} item={item} />
          ))}
        </div>

        {/* Moodboard footer */}
        <div className="text-center mt-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border border-white/50">
            <h3 className="text-3xl font-light mb-4 text-black">
              Love this moodboard?
            </h3>
            <p className="text-gray-700 mb-6 text-lg font-light">
              Chat with StyleList to discover similar pieces or create a new moodboard
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
                className="bg-white/50 hover:bg-white/70 border-white/50"
              >
                View All Moodboards
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}