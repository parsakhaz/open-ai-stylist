'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/app/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, X } from 'lucide-react';

export function ChatSidebar() {
  const chatSessions = useAppStore(state => state.chatSessions);
  const deleteChatSession = useAppStore(state => state.deleteChatSession);
  const pathname = usePathname();

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChatSession(chatId);
    }
  };

  return (
    <aside className="w-64 h-screen flex flex-col border-r bg-gray-100/40 p-4 hidden md:flex">
      <Link href="/chat">
        <Button variant="outline" className="w-full justify-start gap-2">
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </Link>
      <h2 className="my-4 px-2 text-lg font-semibold tracking-tight">
        My Chats
      </h2>
      <ScrollArea className="flex-1 -mx-4 px-4">
        <div className="space-y-1">
          {chatSessions.length === 0 ? (
            <div className="text-center text-gray-500 text-sm py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No chats yet</p>
              <p className="text-xs">Start a new conversation above</p>
            </div>
          ) : (
            chatSessions
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map(session => {
                const isActive = pathname === `/chat/${session.id}`;
                return (
                  <div key={session.id} className="relative group">
                    <Link href={`/chat/${session.id}`}>
                      <Button
                        variant={isActive ? 'secondary' : 'ghost'}
                        className="w-full justify-start gap-2 pr-8"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span className="truncate">{session.title}</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                      onClick={(e) => handleDeleteChat(e, session.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })
          )}
        </div>
      </ScrollArea>
    </aside>
  );
} 