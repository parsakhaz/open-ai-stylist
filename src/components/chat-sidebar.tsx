'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/app/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, X, Palette, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function ChatSidebar() {
  const { chatSessions, deleteChatSession, moodboards } = useAppStore();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChatSession(chatId);
    }
  };

  const handleClearAllChats = () => {
    if (confirm('Are you sure you want to delete all chats? This action cannot be undone.')) {
      chatSessions.forEach(session => deleteChatSession(session.id));
    }
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col relative z-10 transition-all duration-300 h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex-shrink-0">
              <img src="/assets/Logobigger.webp" alt="StyleList" className="h-8" />
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* New Chat Button */}
      {!isCollapsed && (
        <div className="p-4">
          <Link href="/chat">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg py-2 text-sm font-medium">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </Link>
        </div>
      )}

      {/* Collapsed New Chat Button */}
      {isCollapsed && (
        <div className="p-2">
          <Link href="/chat">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg p-2">
              <PlusCircle className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Saved Moodboards Section */}
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <Link href="/gallery" className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
            <Palette className="w-4 h-4" />
            <span>Moodboards ({moodboards.length})</span>
          </Link>
        </div>
      )}

      {/* Chat History */}
      <div className="px-4 py-2 flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500">Recent Chats</h3>
            {chatSessions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-gray-400 hover:text-red-600 h-6 px-2"
                onClick={handleClearAllChats}
              >
                Clear all
              </Button>
            )}
          </div>
        )}
        
        <ScrollArea className="h-full">
          <div className="space-y-1">
            {chatSessions.length === 0 ? (
              !isCollapsed && (
                <div className="text-center text-gray-400 text-xs py-4">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>No chats yet</p>
                  <p className="text-[10px]">Start a new conversation</p>
                </div>
              )
            ) : (
              chatSessions
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map(session => {
                  const isActive = pathname === `/chat/${session.id}`;
                  return (
                    <div key={session.id} className="relative group">
                      <Link href={`/chat/${session.id}`}>
                        <div className={`${isCollapsed ? 'p-2' : 'py-2 px-2'} rounded hover:bg-gray-100 transition-colors cursor-pointer ${
                          isActive ? 'bg-gray-100 border-l-2 border-purple-500' : ''
                        }`}>
                          {isCollapsed ? (
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                          ) : (
                            <div className="text-sm text-gray-700 truncate pr-6">
                              {session.title}
                            </div>
                          )}
                        </div>
                      </Link>
                      {!isCollapsed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                          onClick={(e) => handleDeleteChat(e, session.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer Actions */}
      {!isCollapsed && chatSessions.length > 6 && (
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
            Showing recent chats
          </div>
        </div>
      )}
    </div>
  );
} 