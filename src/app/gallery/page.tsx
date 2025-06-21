'use client';

import { useAppStore } from '../store/useAppStore';
import Link from 'next/link';

export default function GalleryPage() {
  const { moodboards } = useAppStore();

  if (moodboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Your Gallery is Empty</h1>
        <p className="text-gray-600 mb-6">Go to the chat to discover items and create your first mood board!</p>
        <Link href="/chat" className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700">
            Start Chatting
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">My Mood Boards</h1>
      <div className="space-y-12">
        {moodboards.map((board) => (
          <div key={board.id}>
            <h2 className="text-2xl font-bold">{board.title}</h2>
            <p className="text-gray-500 mb-4">{board.description}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {board.items.map((item) => (
                <a key={item.id} href={item.buyLink} target="_blank" rel="noopener noreferrer" className="block group">
                  <div className="relative aspect-w-3 aspect-h-4 overflow-hidden rounded-lg">
                    <img src={item.tryOnUrl} alt={`Try-on of ${item.name}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 text-white">
                      <p className="font-bold text-sm">{item.name}</p>
                      <span className="text-xs bg-black/50 px-2 py-1 rounded-full">Buy Now</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 