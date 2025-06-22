'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/app/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Palette, 
  MessageSquare, 
  User, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { useState } from 'react';

export function GallerySidebar() {
  const { moodboards, chatSessions } = useAppStore();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const recentChats = chatSessions
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const navigationItems = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    },
    {
      href: '/chat',
      label: 'Chat',
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    },
    {
      href: '/onboarding',
      label: 'Photos',
      icon: User,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    },
    {
      href: '/gallery',
      label: 'Gallery',
      icon: Palette,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    }
  ];

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col relative z-10 transition-all duration-300 h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <Link href="/" className="flex-shrink-0">
              <img src="/assets/Logobigger.webp" alt="StyleList" className="h-6 sm:h-8 w-auto" />
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

      {/* Navigation Menu */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4`}>
        <div className={`${isCollapsed ? 'space-y-3' : 'space-y-2'}`}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (pathname.startsWith('/gallery') && item.href === '/gallery');
            
            return (
              <Link key={item.href} href={item.href}>
                <div className={`${isCollapsed ? 'w-12 h-12 justify-center' : 'py-3 px-4'} rounded-xl transition-all duration-200 cursor-pointer flex items-center gap-3 group ${
                  isActive 
                    ? `${item.bgColor} ${item.color} shadow-sm scale-105` 
                    : `text-gray-500 ${item.hoverColor} hover:scale-105 hover:shadow-sm`
                }`}>
                  <Icon className={`${isCollapsed ? 'h-5 w-5' : 'h-5 w-5'} flex-shrink-0 transition-transform group-hover:scale-110`} />
                  {!isCollapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Moodboards Summary */}
      {!isCollapsed && (
        <div className="px-4 py-2">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-4 text-white shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Palette className="w-6 h-6" />
              <div className="text-right">
                <div className="text-2xl font-bold">{moodboards.length}</div>
                <div className="text-xs opacity-90">boards</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm opacity-90">
              <span>Total pieces</span>
              <span className="font-semibold">{moodboards.reduce((total, board) => total + board.items.length, 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Chats */}
      {!isCollapsed && recentChats.length > 0 && (
        <div className="px-4 py-2 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {recentChats.map((session, index) => {
              const isToday = new Date(session.createdAt).toDateString() === new Date().toDateString();
              return (
                <Link key={session.id} href={`/chat/${session.id}`}>
                  <div className="py-2 px-3 rounded-lg hover:bg-white/80 transition-all duration-200 cursor-pointer bg-white/40 border border-white/50 hover:shadow-sm group">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        isToday ? 'bg-green-400' : index === 0 ? 'bg-blue-400' : 'bg-gray-300'
                      }`} />
                      <div className="text-sm text-gray-900 truncate group-hover:text-gray-700">
                        {session.title}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link href="/chat" className="block mt-4 px-3 py-2 text-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-200 hover:shadow-sm text-sm font-medium">
            + New Chat
          </Link>
        </div>
      )}

    </div>
  );
}