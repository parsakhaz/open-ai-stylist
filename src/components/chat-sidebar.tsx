'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/app/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare } from 'lucide-react';

export function ChatSidebar() {
  const chatSessions = useAppStore(state => state.chatSessions);
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-col border-r bg-gray-100/40 p-4 hidden md:flex">
      <Link href="/chat">
        <Button variant="outline" className="w-full justify-start gap-2">
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </Link>
      <h2 className="my-4 px-2 text-lg font-semibold tracking-tight">
        My Chats
      </h2>
      <ScrollArea className="flex-1">
        <div className="space-y-1">
          {chatSessions
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map(session => {
              const isActive = pathname === `/chat/${session.id}`;
              return (
                <Link key={session.id} href={`/chat/${session.id}`}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="truncate">{session.title}</span>
                  </Button>
                </Link>
              );
            })}
        </div>
      </ScrollArea>
    </aside>
  );
} 