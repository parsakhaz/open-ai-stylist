'use client';

import { useAppStore, MoodboardItem } from '../../store/useAppStore';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, ExternalLink, Star, ShoppingBag, Palette, X, RefreshCw } from 'lucide-react';
import { getMoodboardAccents } from '@/lib/moodboard-backgrounds';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kalam } from 'next/font/google';

const kalam = Kalam({ subsets: ['latin'], weight: ['400', '700'] });

// Generate strategic positions for canvas layout with row-based screen height spacing
function generateCanvasPosition(index: number, totalItems: number, seed: number = 12345) {
  const itemsPerRow = 3;
  const row = Math.floor(index / itemsPerRow);
  const col = index % itemsPerRow;
  
  // Seeded random function
  const seededRandom = (i: number) => {
    const x = Math.sin(seed * (i + index + 1)) * 10000;
    return x - Math.floor(x);
  };
  
  // Each row takes up a more reasonable height
  const rowHeightVh = 60; // 60vh per row
  const baseTopOffset = 5; // 5vh from top of each row
  const baseLeftOffset = 8; // 8% from left
  const itemSpacing = 32; // 32% spacing between items horizontally
  
  // Calculate position within the current row
  const topPosition = (row * rowHeightVh) + baseTopOffset + (seededRandom(1) * 15); // Add some vertical variation within row
  const leftPosition = baseLeftOffset + (col * itemSpacing) + (seededRandom(2) * 8 - 4); // Add some horizontal variation
  
  // Random properties for natural look
  const randomWidth = 18 + (seededRandom(3) * 8); // 18-26% width
  const randomRotation = (seededRandom(4) - 0.5) * 8; // -4 to 4 degrees
  const randomScale = 0.95 + (seededRandom(5) * 0.3); // 0.95 to 1.25 scale
  
  return {
    top: `${Math.min(topPosition, (row * rowHeightVh) + 50)}vh`, // Use vh units, max 50vh within each row
    left: `${Math.max(5, Math.min(leftPosition, 85))}%`, // Keep within 5-85% horizontally
    width: `${randomWidth}%`,
    rotation: `${randomRotation}deg`,
    scale: randomScale,
  };
}

// Generate realistic tape edge patterns using SVG clip-path
function generateTapeClipPath(isHorizontal: boolean, seed: number, index: number) {
  const random = (i: number) => ((seed * (i + index + 1) * 9301 + 49297) % 233280) / 233280;
  
  if (isHorizontal) {
    // Generate jagged edges for LEFT and RIGHT ends of horizontal tape (short sides)
    const points = [];
    const steps = 3; // Fewer points for short edges - just 3-4 jagged points
    
    // Left edge (jagged - where tape was cut/torn)
    for (let i = 0; i <= steps; i++) {
      const y = (i / steps) * 100;
      const x = random(i * 2) * 15 + 8; // 8-23% from left, smaller jagged area
      points.push(`${x}% ${y}%`);
    }
    
    // Bottom edge (straight)
    points.push('92% 100%');
    
    // Right edge (jagged - where tape was cut/torn)
    for (let i = steps; i >= 0; i--) {
      const y = (i / steps) * 100;
      const x = 100 - (random(i * 2 + 100) * 15 + 8); // 77-92% from left
      points.push(`${x}% ${y}%`);
    }
    
    // Top edge (straight)
    points.push('23% 0%');
    
    return `polygon(${points.join(', ')})`;
  } else {
    // Generate jagged edges for TOP and BOTTOM ends of vertical tape (short sides)  
    const points = [];
    const steps = 3; // Fewer points for short edges
    
    // Top edge (jagged - where tape was cut/torn)
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * 100;
      const y = random(i * 2) * 15 + 8; // 8-23% from top, smaller jagged area
      points.push(`${x}% ${y}%`);
    }
    
    // Right edge (straight)
    points.push('100% 77%');
    
    // Bottom edge (jagged - where tape was cut/torn)
    for (let i = steps; i >= 0; i--) {
      const x = (i / steps) * 100;
      const y = 100 - (random(i * 2 + 100) * 15 + 8); // 77-92% from top
      points.push(`${x}% ${y}%`);
    }
    
    // Left edge (straight)
    points.push('0% 23%');
    
    return `polygon(${points.join(', ')})`;
  }
}

// Generate random tape placement for each item
function generateTapeElements(itemId: string) {
  // Use item ID to ensure consistent tape placement per item
  const seed = itemId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (index: number) => {
    return ((seed * (index + 1) * 9301 + 49297) % 233280) / 233280;
  };
  
  const tapeCount = Math.floor(random(0) * 3) + 2; // 2-4 pieces of tape
  const tapes = [];
  
  // Ensure even distribution of tape on different sides
  const sides = [0, 1, 2, 3]; // top, right, bottom, left
  const shuffledSides = sides.sort(() => random(10) - 0.5);
  
  for (let i = 0; i < tapeCount; i++) {
    const side = shuffledSides[i % 4]; // distribute evenly across sides
    // Better spacing to avoid overlap - divide each side into segments
    const segmentSize = 80 / Math.ceil(tapeCount / 4);
    const segmentIndex = Math.floor(i / 4);
    const basePosition = 10 + (segmentIndex * segmentSize) + (random(i + 2) * segmentSize * 0.6);
    const position = Math.min(90, Math.max(10, basePosition)); // keep within 10-90%
    const rotation = (random(i + 3) - 0.5) * 30; // -15 to 15 degrees
    const length = (random(i + 4) * 30 + 25) * 1.3 * 1.4; // 40% longer on top of existing 30%: 45.5-100px length
    
    let style: React.CSSProperties = {
      backgroundColor: '#CABEA4',
      border: '1px solid #B8AB94',
    };
    let className = 'absolute shadow-md opacity-70 z-10';
    
    // Determine if tape is horizontal or vertical
    const isHorizontal = side === 0 || side === 2; // top or bottom
    const clipPath = generateTapeClipPath(isHorizontal, seed, i);
    
    switch (side) {
      case 0: // top
        style = {
          ...style,
          top: '-8px',
          left: `${position}%`,
          width: `${length}px`,
          height: '19px',
          transform: `translateX(-50%) rotate(${rotation}deg)`,
          clipPath: clipPath,
        };
        break;
      case 1: // right
        style = {
          ...style,
          right: '-8px',
          top: `${position}%`,
          width: '19px',
          height: `${length}px`,
          transform: `translateY(-50%) rotate(${rotation}deg)`,
          clipPath: clipPath,
        };
        break;
      case 2: // bottom
        style = {
          ...style,
          bottom: '-8px',
          left: `${position}%`,
          width: `${length}px`,
          height: '19px',
          transform: `translateX(-50%) rotate(${rotation}deg)`,
          clipPath: clipPath,
        };
        break;
      case 3: // left
        style = {
          ...style,
          left: '-8px',
          top: `${position}%`,
          width: '19px',
          height: `${length}px`,
          transform: `translateY(-50%) rotate(${rotation}deg)`,
          clipPath: clipPath,
        };
        break;
    }
    
    tapes.push({ style, className });
  }
  
  return tapes;
}

// Product card component for collection detail view
function MoodboardProductCard({ item, boardId, position }: { item: MoodboardItem; boardId: string; position: any }) {
  const { removeMoodboardItem } = useAppStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const displayUrl = isHovered ? item.imageUrl : item.tryOnUrl;
  const tapeElements = generateTapeElements(item.id);

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
      {/* Tape elements - positioned outside card to extend beyond boundaries */}
      {tapeElements.map((tape, idx) => (
        <div
          key={idx}
          className={tape.className}
          style={tape.style}
        />
      ))}
      <div className="relative bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border-4 border-white overflow-hidden h-full group-hover:scale-105 group-hover:rotate-0 group-hover:!z-[100]">
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
            <div className="absolute bottom-2 left-2 bg-black text-white px-2 py-1 rounded-md text-xs font-medium">
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
  const [layoutSeed, setLayoutSeed] = useState(12345);

  const moodboard = moodboards.find(board => board.id === moodboardId);
  const { background, accents } = moodboard ? getMoodboardAccents(moodboard.id) : { background: null, accents: [] };
  
  const refreshLayout = () => {
    setLayoutSeed(Math.floor(Math.random() * 100000));
  };

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
              <h1 className={`text-2xl font-bold text-black ${kalam.className}`} style={{fontFamily: 'Kalam, cursive'}}>
                {moodboard.title}
              </h1>
              <p className="text-sm text-gray-600 max-w-md">
                {moodboard.description}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                {moodboard.items.length} pieces
              </div>
            </div>
            
            <Button 
              onClick={refreshLayout}
              variant="ghost" 
              size="sm"
              className="hover:bg-gray-100 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Layout
            </Button>
          </div>
        </div>

        {/* Canvas-style moodboard layout with light cream background */}
        <div className="relative w-full" 
             style={{
               minHeight: `${Math.max(1, Math.ceil(moodboard.items.length / 3)) * 60}vh`, // Dynamic height based on rows needed
               backgroundColor: '#FEFCF9',
               backgroundImage: `
                 radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
                 radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
                 radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.01) 1px, transparent 1px)
               `,
               backgroundSize: `
                 80px 80px,
                 120px 120px,
                 60px 60px
               `,
               backgroundPosition: `
                 0 0,
                 40px 40px,
                 20px 20px
               `
             }}>

          {moodboard.items.map((item, index) => {
            const position = generateCanvasPosition(index, moodboard.items.length, layoutSeed);
            return (
              <MoodboardProductCard 
                key={`${item.id}-${layoutSeed}`} // Add layoutSeed to key to force re-render
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