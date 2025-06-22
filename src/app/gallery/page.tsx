'use client';

import { useAppStore } from '../store/useAppStore';
import Link from 'next/link';
import { BentoGrid, BentoGridItem } from '@/components/aceternity/bento-grid';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function GalleryPage() {
  const { moodboards } = useAppStore();

  if (moodboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Your Gallery is Empty</h1>
        <p className="text-gray-600 mb-6">Create your first mood board in the chat!</p>
        <Link href="/chat">
          <Button>
            Start Chatting <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  // Flatten the moodboards into items for the grid
  const items = moodboards.flatMap((board, boardIndex) => 
    board.items.map((item, itemIndex) => ({
      title: item.name,
      description: board.title,
      header: <img src={item.tryOnUrl} alt={item.name} className="w-full h-full object-cover" />,
      className: itemIndex === 0 ? 'md:col-span-2' : 'md:col-span-1',
      icon: <img src={board.items[0].tryOnUrl} className="h-4 w-4 rounded-full" />,
      buyLink: item.buyLink,
    }))
  );

  return (
    <div className="container mx-auto p-4 md:p-8 pt-20">
      <h1 className="text-4xl font-bold mb-8">My Mood Boards</h1>
      <BentoGrid className="max-w-4xl mx-auto md:auto-rows-[20rem]">
        {items.map((item, i) => (
          <a href={item.buyLink} target="_blank" rel="noopener noreferrer" key={i}>
            <BentoGridItem
              title={item.title}
              description={item.description}
              header={item.header}
              className={item.className}
              icon={item.icon}
            />
          </a>
        ))}
      </BentoGrid>
    </div>
  );
} 