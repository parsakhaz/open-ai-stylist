'use client';

import { useAppStore } from '../store/useAppStore';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Heart, ExternalLink, Star, Tag, ShoppingBag } from 'lucide-react';

export default function GalleryPage() {
  const { moodboards } = useAppStore();

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

        {/* Mood boards grid */}
        <div className="space-y-20">
          {moodboards.map((board, boardIndex) => (
            <div key={board.id} className="relative">
              {/* Board header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2 border border-gray-200 mb-6">
                  <Tag className="w-4 h-4 text-gray-700" />
                  <span className="font-medium text-gray-700 text-sm">Collection {boardIndex + 1}</span>
                </div>
                <h2 className="text-3xl font-light mb-3 text-black tracking-tight">{board.title}</h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto font-light">{board.description}</p>
              </div>

              {/* Products masonry grid */}
              <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
                {board.items.map((item, itemIndex) => (
                  <div key={`${board.id}-${item.id}`} className="break-inside-avoid">
                    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-500 border border-gray-200 overflow-hidden">
                      {/* Product image */}
                      <div className="relative aspect-[3/4] overflow-hidden bg-gray-50">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        
                        {/* Minimal overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                        
                        {/* Floating action buttons */}
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

                        {/* Price badge */}
                        {item.price && (
                          <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 rounded-md text-sm font-medium">
                            {item.price}
                          </div>
                        )}

                        {/* Prime badge */}
                        {item.isPrime && (
                          <div className="absolute top-4 left-4 mt-10 bg-gray-800 text-white px-2 py-1 rounded text-xs font-medium">
                            prime
                          </div>
                        )}
                      </div>

                      {/* Product info */}
                      <div className="p-5">
                        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
                          {item.name}
                        </h3>
                        
                        {/* Rating */}
                        {item.rating && item.ratingCount && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-gray-400 fill-gray-400" />
                              <span className="text-sm font-medium text-gray-700">{item.rating}</span>
                            </div>
                            <span className="text-xs text-gray-500">({item.ratingCount})</span>
                          </div>
                        )}

                        {/* Price info */}
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
                ))}
              </div>

              {/* Board footer */}
              <div className="text-center mt-12">
                <div className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <span>{board.items.length} items</span>
                  <span>•</span>
                  <span>Ready to shop</span>
                </div>
              </div>
            </div>
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