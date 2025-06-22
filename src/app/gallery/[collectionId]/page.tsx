'use client';

import { useAppStore, MoodboardItem } from '../../store/useAppStore';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, ExternalLink, Star, ShoppingBag, Palette, X } from 'lucide-react';
import { getMoodboardAccents } from '@/lib/moodboard-backgrounds';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Generate strategic positions for canvas layout
function generateCanvasPosition(index: number, totalItems: number) {
  // Create a more natural spread across the canvas
  const positions = [
    // Top row - can now start from top since header is above canvas
    { top: '5%', left: '8%', width: '22%', rotation: '-3deg', scale: 1.0 },
    { top: '8%', left: '35%', width: '24%', rotation: '2deg', scale: 1.1 },
    { top: '3%', left: '62%', width: '20%', rotation: '-1deg', scale: 0.95 },
    
    // Second row
    { top: '28%', left: '5%', width: '26%', rotation: '1deg', scale: 1.15 },
    { top: '32%', left: '35%', width: '22%', rotation: '-2deg', scale: 1.0 },
    { top: '25%', left: '65%', width: '28%', rotation: '2.5deg', scale: 1.2 },
    
    // Third row
    { top: '52%', left: '10%', width: '24%', rotation: '-1deg', scale: 1.05 },
    { top: '48%', left: '40%', width: '26%', rotation: '1.5deg', scale: 1.1 },
    { top: '55%', left: '70%', width: '22%', rotation: '-2.5deg', scale: 1.0 },
    
    // Fourth row
    { top: '75%', left: '8%', width: '25%', rotation: '2deg', scale: 1.08 },
    { top: '72%', left: '38%', width: '23%', rotation: '-1deg', scale: 1.0 },
    { top: '78%', left: '68%', width: '27%', rotation: '1deg', scale: 1.15 },
  ];
  
  // If we have more items than predefined positions, generate them algorithmically
  if (index >= positions.length) {
    const extraIndex = index - positions.length;
    const rowHeight = 110; // Start below the predefined positions
    const itemsPerRow = 3; // Fewer items per row since they're bigger
    const row = Math.floor(extraIndex / itemsPerRow);
    const col = extraIndex % itemsPerRow;
    
    return {
      top: `${rowHeight + (row * 25)}%`,
      left: `${8 + (col * 30)}%`,
      width: `${22 + (Math.random() * 8)}%`, // Random width between 22-30%
      rotation: `${(Math.random() - 0.5) * 6}deg`, // Random rotation -3 to 3 degrees
      scale: 1.0 + (Math.random() * 0.25), // Random scale 1.0 to 1.25
    };
  }
  
  return positions[index];
}

// Product card component for collection detail view
function MoodboardProductCard({ item, boardId, position }: { item: MoodboardItem; boardId: string; position: any }) {
  const { removeMoodboardItem } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayUrl = isHovered ? item.imageUrl : item.tryOnUrl;

  const handleDeleteItem = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Remove "${item.name}" from this moodboard?`)) {
      setIsDeleting(true);
      try {
        removeMoodboardItem(boardId, item.id);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to remove item');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div 
      className="absolute group"
      style={{
        ...position,
        aspectRatio: '3/4',
        transform: `rotate(${position.rotation}) scale(${position.scale})`,
        zIndex: Math.floor(Math.random() * 10) + 1, // Random stacking
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative bg-white rounded-lg shadow-lg hover:shadow-2xl transition-all duration-500 border-2 border-white overflow-hidden h-full group-hover:scale-105 group-hover:rotate-0 group-hover:!z-[100]">
        <div className="relative h-full overflow-hidden bg-gray-50">
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
          
          {/* Delete button */}
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <Button
              variant="secondary"
              size="icon"
              className="h-5 w-5 bg-black hover:bg-red-600 text-white border-0 shadow-lg p-0 rounded-full"
              onClick={handleDeleteItem}
              disabled={isDeleting}
            >
              {isDeleting ? 
                <div className="animate-spin rounded-full h-2 w-2 border-b-2 border-white" /> : 
                <X className="h-2 w-2" />
              }
            </Button>
          </div>
          
          <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <button className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110">
              <Heart className="w-3 h-3 text-gray-700 hover:text-black transition-colors" />
            </button>
            <a 
              href={item.buyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-7 h-7 bg-black rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110"
            >
              <ExternalLink className="w-3 h-3 text-white" />
            </a>
          </div>

          {item.price && (
            <div className="absolute top-8 left-2 bg-black text-white px-2 py-1 rounded-md text-xs font-medium">
              {item.price}
            </div>
          )}

          {item.isPrime && (
            <div className="absolute top-14 left-2 bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium">
              prime
            </div>
          )}
        </div>

        {/* Compact product info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
            {item.name}
          </h3>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {item.price && (
                <span className="text-sm font-semibold text-black">{item.price}</span>
              )}
              {item.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gray-400 fill-gray-400" />
                  <span className="text-xs text-gray-600">{item.rating}</span>
                </div>
              )}
            </div>
            
            <a 
              href={item.buyLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-medium text-gray-600 hover:text-black transition-colors"
            >
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

      <div className="relative w-full h-full">
        {/* Header above canvas */}
        <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 py-4 px-6">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <Button 
              onClick={() => router.push('/gallery')} 
              variant="ghost" 
              className="hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Gallery
            </Button>
            
            <div className="text-center">
              <div className="flex items-center gap-2 justify-center mb-1">
                <Palette className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Moodboard</span>
              </div>
              <h1 className="text-xl font-medium text-black">
                {moodboard.title}
              </h1>
              <p className="text-sm text-gray-600 max-w-md">
                {moodboard.description}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {moodboard.items.length} pieces
              </div>
            </div>
            
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
        </div>

        {/* Canvas-style moodboard layout */}
        <div className="relative min-h-screen w-full bg-gradient-to-br from-amber-50 to-yellow-50"
             style={{
               backgroundImage: `
                 linear-gradient(90deg, rgba(147, 197, 253, 0.3) 1px, transparent 1px),
                 linear-gradient(rgba(147, 197, 253, 0.3) 1px, transparent 1px),
                 radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.03) 1px, transparent 1px),
                 radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.03) 1px, transparent 1px),
                 radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.02) 1px, transparent 1px)
               `,
               backgroundSize: `
                 24px 24px,
                 24px 24px,
                 80px 80px,
                 120px 120px,
                 60px 60px
               `,
               backgroundPosition: `
                 0 0,
                 0 0,
                 0 0,
                 40px 40px,
                 20px 20px
               `
             }}>

          {moodboard.items.map((item, index) => {
            const position = generateCanvasPosition(index, moodboard.items.length);
            return (
              <MoodboardProductCard 
                key={item.id} 
                item={item} 
                boardId={moodboard.id} 
                position={position}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}