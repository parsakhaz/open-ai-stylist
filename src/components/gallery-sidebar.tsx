'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/app/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight,
  Plus
} from 'lucide-react';
import { useState } from 'react';

export function GallerySidebar() {
  const { moodboards, chatSessions } = useAppStore();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const recentChats = chatSessions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

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

      {/* Create New Moodboard Button */}
      {!isCollapsed && (
        <div className="p-4">
          <Link href="/chat">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg py-2 text-sm font-medium">
              <Plus className="w-4 h-4 mr-2" />
              New Moodboard
            </Button>
          </Link>
        </div>
      )}

      {/* Collapsed Create Button */}
      {isCollapsed && (
        <div className="p-2">
          <Link href="/chat">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg p-2">
              <Plus className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Saved Moodboards Section */}
      {!isCollapsed && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Palette className="w-4 h-4" />
            <span>Saved ({moodboards.length})</span>
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="px-4 py-2 flex-1 overflow-y-auto">
        {!isCollapsed && (
          <h3 className="text-xs font-medium text-gray-500 mb-3">Recent Chats</h3>
        )}
        
        <div className="space-y-1">
          {recentChats.length === 0 ? (
            !isCollapsed && (
              <div className="text-center text-gray-400 text-xs py-4">
                <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                <p>No chats yet</p>
              </div>
            )
          ) : (
            recentChats.map(session => {
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
                        <div className="text-sm text-gray-700 truncate">
                          {session.title}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>
        
        {!isCollapsed && recentChats.length > 0 && (
          <Link href="/chat" className="block text-xs text-blue-600 hover:text-blue-800 mt-2 px-2">
            View all chats →
          </Link>
        )}
      </div>

    </div>
  );
}