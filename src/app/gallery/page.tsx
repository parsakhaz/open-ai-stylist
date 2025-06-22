'use client';

import { useAppStore } from '../store/useAppStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, Eye, Palette, Trash2, X, Sparkles, Grid3X3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { getMoodboardAccents } from '@/lib/moodboard-backgrounds';

// Moodboard card component with dynamic backgrounds
function MoodboardCard({ board, index }: { board: any; index: number }) {
  const router = useRouter();
  const { deleteMoodboard } = useAppStore();
  const { background, accents } = getMoodboardAccents(board.id);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  
  // Get first 4 items for preview grid
  const previewItems = board.items.slice(0, 4);

  const handleDeleteBoard = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${board.title}"?`)) {
      setIsDeletingBoard(true);
      try {
        deleteMoodboard(board.id);
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete moodboard');
      } finally {
        setIsDeletingBoard(false);
      }
    }
  };
  
  return (
    <div 
      className="group cursor-pointer bg-white/95 backdrop-blur-sm rounded-xl shadow-md hover:shadow-2xl transition-all duration-500 border border-amber-200/30 overflow-hidden hover:border-amber-300/50"
      onClick={() => router.push(`/gallery/${board.id}`)}
    >
      {/* Dynamic background with preview grid */}
      <div 
        className="relative aspect-square overflow-hidden"
        style={{
          backgroundColor: background.colors[0],
          backgroundImage: background.pattern,
        }}
      >
        {/* Strategic accent elements */}
        {accents.map((accent, idx) => (
          <div
            key={idx}
            className={`absolute pointer-events-none`}
            style={{
              left: `${accent.x}%`,
              top: `${accent.y}%`,
              transform: `rotate(${accent.rotation}deg)`,
              opacity: accent.opacity,
            }}
          >
            {accent.type === 'circle' && (
              <div 
                className="rounded-full border border-gray-400"
                style={{ width: accent.size, height: accent.size }}
              />
            )}
            {accent.type === 'line' && (
              <div 
                className="bg-gray-400"
                style={{ width: accent.size, height: 1 }}
              />
            )}
            {accent.type === 'square' && (
              <div 
                className="border border-gray-400"
                style={{ width: accent.size * 0.8, height: accent.size * 0.8 }}
              />
            )}
          </div>
        ))}
        
        {/* Preview items positioned strategically */}
        {previewItems.length > 0 ? (
          <div className="absolute inset-4">
            {previewItems.map((item: any, idx: number) => {
              // Strategic positioning for moodboard feel
              const positions = [
                { top: '5%', left: '10%', width: '35%', rotation: '-2deg' },
                { top: '15%', right: '5%', width: '40%', rotation: '1deg' },
                { bottom: '20%', left: '5%', width: '38%', rotation: '2deg' },
                { bottom: '5%', right: '15%', width: '32%', rotation: '-1deg' },
              ];
              const pos = positions[idx] || positions[0];
              
              return (
                <div
                  key={item.id}
                  className="absolute shadow-md rounded-lg overflow-hidden border-2 border-white group-hover:scale-105 transition-transform duration-500"
                  style={{
                    ...pos,
                    aspectRatio: '3/4',
                    transform: `rotate(${pos.rotation}) ${idx < 3 ? 'scale(1)' : 'scale(0.85)'}`,
                    zIndex: 4 - idx,
                  }}
                >
                  <img 
                    src={item.tryOnUrl || item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {idx === 3 && board.items.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-medium text-xs">+{board.items.length - 4}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Palette className="w-12 h-12 text-gray-300" />
          </div>
        )}
        
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-500"></div>
        
        {/* Delete button */}
        <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 bg-black hover:bg-red-600 text-white border-0 shadow-lg p-0 rounded-full"
            onClick={handleDeleteBoard}
            disabled={isDeletingBoard}
          >
            {isDeletingBoard ? 
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" /> : 
              <X className="h-3 w-3" />
            }
          </Button>
        </div>

        {/* View button */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg border border-white/50">
            <Eye className="w-4 h-4 text-gray-700" />
          </div>
        </div>
        
        {/* Moodboard badge */}
        <div className="absolute bottom-4 left-4">
          <div className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/50 shadow-sm">
            <Palette className="w-3 h-3 text-gray-600" />
            <span className="font-medium text-gray-700 text-xs">Board {index + 1}</span>
          </div>
        </div>
      </div>
      
      {/* Moodboard info */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-2 text-lg group-hover:text-black transition-colors">
          {board.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4 leading-relaxed">
          {board.description}
        </p>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{board.items.length} pieces</span>
          <span className="text-gray-400 group-hover:text-gray-600 transition-colors">Open moodboard →</span>
        </div>
      </div>
    </div>
  );
}

// Full-screen try-on modal
function TryOnModal({ 
  isOpen, 
  onClose, 
  item, 
  allTryOns, 
  currentIndex 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  item: any; 
  allTryOns: any[];
  currentIndex: number;
}) {
  const [activeIndex, setActiveIndex] = useState(currentIndex);
  
  const goToPrevious = useCallback(() => {
    setActiveIndex(prev => prev > 0 ? prev - 1 : allTryOns.length - 1);
  }, [allTryOns.length]);
  
  const goToNext = useCallback(() => {
    setActiveIndex(prev => prev < allTryOns.length - 1 ? prev + 1 : 0);
  }, [allTryOns.length]);
  
  // Sync activeIndex when modal opens with new item
  useEffect(() => {
    setActiveIndex(currentIndex);
  }, [currentIndex, isOpen]);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, goToPrevious, goToNext]);
  
  if (!isOpen || !item) return null;

  const currentItem = allTryOns[activeIndex];

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full h-10 w-10"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Previous button */}
        {allTryOns.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full h-12 w-12"
          >
            <ArrowRight className="h-6 w-6 rotate-180" />
          </Button>
        )}

        {/* Next button */}
        {allTryOns.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white border-0 rounded-full h-12 w-12"
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        )}

        {/* Main image */}
        <div 
          className="relative max-w-full max-h-full flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl max-h-[70vh]">
            <img 
              src={currentItem.tryOnUrl} 
              alt={currentItem.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          {/* Image info */}
          <div className="mt-4 text-center max-w-lg">
            <h3 className="text-white text-lg font-semibold mb-1">{currentItem.name}</h3>
            <p className="text-white/80 text-sm">from {currentItem.boardTitle}</p>
            {currentItem.price && (
              <p className="text-white/90 text-base font-medium mt-2">{currentItem.price}</p>
            )}
            
            {/* Action buttons */}
            <div className="flex gap-3 mt-4 justify-center">
              <Link href={`/gallery/${currentItem.boardId}`}>
                <Button className="bg-white text-black hover:bg-gray-100 px-6">
                  <Palette className="w-4 h-4 mr-2" />
                  View Moodboard
                </Button>
              </Link>
              {currentItem.buyLink && (
                <a href={currentItem.buyLink} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:text-black px-6">
                    Buy Now
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Image counter */}
        {allTryOns.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {activeIndex + 1} of {allTryOns.length}
          </div>
        )}
      </div>
    </div>
  );
}

// Try-On Results component
function TryOnResults() {
  const { moodboards } = useAppStore();
  const [selectedTryOn, setSelectedTryOn] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // Extract all try-on images from all moodboards
  const allTryOns = moodboards.flatMap(board => 
    board.items
      .filter(item => item.tryOnUrl && item.tryOnUrl !== item.imageUrl)
      .map(item => ({
        ...item,
        boardTitle: board.title,
        boardId: board.id
      }))
  );

  if (allTryOns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-white/95 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-12 shadow-lg text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
            <Sparkles className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-semibold mb-4 text-gray-900">No Try-Ons Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Your virtual try-on images will appear here when you create moodboards or use Auto-Style mode.
          </p>
          <Link href="/chat">
            <Button className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-lg">
              Start Styling <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const openModal = (item: any, index: number) => {
    setSelectedTryOn(item);
    setSelectedIndex(index);
  };

  const closeModal = () => {
    setSelectedTryOn(null);
  };

  return (
    <>
      <TryOnModal
        isOpen={!!selectedTryOn}
        onClose={closeModal}
        item={selectedTryOn}
        allTryOns={allTryOns}
        currentIndex={selectedIndex}
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {allTryOns.map((item, index) => (
          <div 
            key={`${item.boardId}-${item.id}`}
            className="group relative bg-white/95 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer"
            onClick={() => openModal(item, index)}
          >
            <div className="aspect-[3/4] overflow-hidden">
              <img 
                src={item.tryOnUrl} 
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            {/* Overlay with info */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300">
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-3">
                <p className="text-white text-sm font-medium truncate">{item.name}</p>
                <p className="text-white/80 text-xs truncate">from {item.boardTitle}</p>
              </div>
            </div>
            
            {/* View in moodboard button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Link href={`/gallery/${item.boardId}`} onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/90 hover:bg-white text-gray-700 border-0 shadow-lg rounded-full"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function GalleryPage() {
  const { moodboards, deleteAllMoodboards } = useAppStore();
  const router = useRouter();
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'try-ons' | 'moodboards'>('try-ons');

  const handleDeleteAll = async () => {
    if (confirm(`Are you sure you want to delete all ${moodboards.length} moodboards? This action cannot be undone.`)) {
      setIsDeletingAll(true);
      try {
        deleteAllMoodboards();
      } catch (error) {
        console.error('Delete all failed:', error);
        alert('Failed to delete all moodboards');
      } finally {
        setIsDeletingAll(false);
      }
    }
  };

  // Get total try-on count for tab display
  const totalTryOns = moodboards.reduce((acc, board) => 
    acc + board.items.filter(item => item.tryOnUrl && item.tryOnUrl !== item.imageUrl).length, 0
  );

  if (moodboards.length === 0) {
    return (
      <div className="min-h-full bg-gradient-to-br from-amber-50 to-yellow-50"
           style={{
             backgroundImage: `
               linear-gradient(90deg, rgba(147, 197, 253, 0.2) 1px, transparent 1px),
               linear-gradient(rgba(147, 197, 253, 0.2) 1px, transparent 1px),
               radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
               radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
               radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.015) 1px, transparent 1px)
             `,
             backgroundSize: `
               32px 32px,
               32px 32px,
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
        <div className="flex flex-col items-center justify-center min-h-full text-center px-4 py-12">
          <div className="bg-white/95 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-12 shadow-lg">
            <div className="mb-8 relative">
              <div className="w-24 h-24 mx-auto bg-black rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-white" fill="currentColor" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 text-black">
              No Moodboards Yet
            </h1>
            <p className="text-gray-600 mb-8 text-lg max-w-md">
              Start chatting with StyleList to discover pieces and create your first moodboard
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
    <div className="min-h-full bg-gradient-to-br from-amber-50 to-yellow-50"
         style={{
           backgroundImage: `
             linear-gradient(90deg, rgba(147, 197, 253, 0.2) 1px, transparent 1px),
             linear-gradient(rgba(147, 197, 253, 0.2) 1px, transparent 1px),
             radial-gradient(circle at 20% 30%, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
             radial-gradient(circle at 80% 70%, rgba(139, 69, 19, 0.02) 1px, transparent 1px),
             radial-gradient(circle at 40% 80%, rgba(139, 69, 19, 0.015) 1px, transparent 1px)
           `,
           backgroundSize: `
             32px 32px,
             32px 32px,
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
      <div className="container mx-auto p-6 md:p-12 pt-8">
        {/* Header with tabs */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-medium text-black">Gallery</h1>
            
            {/* Tab Navigation */}
            <div className="flex bg-white/80 backdrop-blur-sm rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setActiveTab('try-ons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'try-ons'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Try-Ons
                {totalTryOns > 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === 'try-ons' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {totalTryOns}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('moodboards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'moodboards'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Moodboards
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === 'moodboards' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {moodboards.length}
                </span>
              </button>
            </div>
          </div>
          
          {activeTab === 'moodboards' && (
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 hover:border-red-300"
              onClick={handleDeleteAll}
              disabled={isDeletingAll}
            >
              {isDeletingAll ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2" />
              ) : (
                <Trash2 className="w-3 h-3 mr-2" />
              )}
              Delete All
            </Button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'try-ons' ? (
          <TryOnResults />
        ) : (
          <>
            {/* Moodboards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {moodboards.map((board, boardIndex) => (
                <MoodboardCard key={board.id} board={board} index={boardIndex} />
              ))}
            </div>

            {/* Call to action */}
            <div className="text-center mt-20 mb-12">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 border border-amber-200/40 shadow-lg">
                <h3 className="text-3xl font-light mb-4 text-black">
                  Ready for More?
                </h3>
                <p className="text-gray-600 mb-6 text-lg font-light">
                  Chat with StyleList to discover new pieces and create more moodboards
                </p>
                <Link href="/chat">
                  <Button className="bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg text-lg shadow-md hover:shadow-lg transition-all duration-300">
                    Continue Shopping <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 