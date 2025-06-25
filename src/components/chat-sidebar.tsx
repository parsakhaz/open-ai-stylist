'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/app/store/useAppStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, X, Palette, ChevronLeft, ChevronRight, Zap, BarChart3, Sparkles, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

// Mode selector component
function ModeSelector() {
  const { tryOnMode, setTryOnMode } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const modeOptions = [
    {
      value: "performance" as const,
      label: "Performance", 
      description: "Quick results with reduced quality",
      icon: <Zap className="w-4 h-4" />,
      color: "text-orange-600"
    },
    {
      value: "balanced" as const,
      label: "Balanced",
      description: "Good balance of speed and quality",
      icon: <BarChart3 className="w-4 h-4" />,
      color: "text-blue-600"
    },
    {
      value: "quality" as const,
      label: "Quality",
      description: "Best quality, slower processing",
      icon: <Sparkles className="w-4 h-4" />,
      color: "text-purple-600"
    }
  ];

  const currentMode = modeOptions.find(mode => mode.value === tryOnMode);

  return (
    <div className="p-3 border-t border-gray-200 bg-gray-50/50">
      <div className="mb-2">
        <label className="text-xs font-medium text-gray-600 mb-1 block">Try-On Mode</label>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-8 px-3 text-xs bg-white border border-gray-300 rounded-md hover:border-gray-400 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className={currentMode?.color}>{currentMode?.icon}</span>
              <span className="font-medium">{currentMode?.label}</span>
            </div>
            <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              {modeOptions.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => {
                    setTryOnMode(mode.value);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2 text-left hover:bg-gray-50 transition-colors ${
                    mode.value === tryOnMode ? 'bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={mode.color}>{mode.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900 text-xs">{mode.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{mode.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500">
        Current: <span className="font-medium text-gray-700">{currentMode?.label}</span>
      </div>
    </div>
  );
}

export function ChatSidebar() {
  const { 
    chatSessions, 
    deleteChatSession, 
    moodboards,
    processingMoodboards,
    completedMoodboards,
    clearCompletedStatus
  } = useAppStore();
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
          <Link href="/" className="flex-shrink-0 hover:opacity-80 transition-opacity">
            {!isCollapsed ? (
              <img src="/assets/Logobigger.webp" alt="StyleList" className="h-8" />
            ) : (
              <img src="/assets/Logo.png" alt="StyleList" className="h-6 w-6" />
            )}
          </Link>
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
          <Link 
            href="/gallery" 
            className="flex items-center gap-2 text-sm hover:text-gray-800 transition-colors relative"
            onClick={() => {
              // Clear completion status when navigating to gallery
              if (completedMoodboards.size > 0) {
                Array.from(completedMoodboards).forEach(boardId => {
                  clearCompletedStatus(boardId);
                });
              }
            }}
          >
            <Palette className={`w-4 h-4 ${
              processingMoodboards.size > 0 
                ? 'text-blue-500 animate-pulse' 
                : 'text-gray-600'
            }`} />
            <span className={`${
              processingMoodboards.size > 0 
                ? 'text-blue-600 animate-pulse font-medium' 
                : 'text-gray-600'
            }`}>
              Moodboards ({moodboards.length})
            </span>
            
            {/* Completion Badge */}
            {completedMoodboards.size > 0 && (
              <div 
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-bounce cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Clear all completed statuses when clicked
                  Array.from(completedMoodboards).forEach(boardId => {
                    clearCompletedStatus(boardId);
                  });
                }}
                title={`${completedMoodboards.size} moodboard${completedMoodboards.size > 1 ? 's' : ''} completed processing - click to dismiss`}
              />
            )}
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

      {/* Mode Selector - Always at bottom when not collapsed */}
      {!isCollapsed && <ModeSelector />}

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