'use client';

import { useAppStore } from '../store/useAppStore';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { UploadCloud, X, Loader2, CheckCircle, XCircle, Clock, User, Info, Plus, MessageSquare, Bookmark, ArrowRight, Palette, Zap, BarChart3, Sparkles, ChevronDown } from 'lucide-react';
import Link from 'next/link';

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

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { 
    chatSessions,
    deleteChatSession,
    moodboards,
    processingMoodboards,
    completedMoodboards,
    clearCompletedStatus
  } = useAppStore();
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleDeleteChat = (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this chat?')) {
      deleteChatSession(chatId);
    }
  };

  return (
    <div className="min-h-screen relative flex overflow-hidden">
      {/* SVG Gradient Background - Only for main content area */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{
          left: isCollapsed ? '48px' : '224px', // Adjust based on sidebar width
        }}
      >
        <svg 
          width="100%" 
          height="100%" 
          viewBox="0 0 1580 1515" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid slice"
        >
          <g filter="url(#filter0_f_68_8252)">
            <circle cx="604.5" cy="604.5" r="204.5" fill="#9ED5F4"/>
          </g>
          <g filter="url(#filter1_f_68_8252)">
            <circle cx="975.5" cy="655.5" r="204.5" fill="#F9CBE3"/>
          </g>
          <g filter="url(#filter2_f_68_8252)">
            <circle cx="739.5" cy="910.5" r="204.5" fill="#9996CF"/>
          </g>
          <defs>
            <filter id="filter0_f_68_8252" x="0" y="0" width="1209" height="1209" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur_68_8252"/>
            </filter>
            <filter id="filter1_f_68_8252" x="371" y="51" width="1209" height="1209" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur_68_8252"/>
            </filter>
            <filter id="filter2_f_68_8252" x="135" y="306" width="1209" height="1209" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
              <feFlood floodOpacity="0" result="BackgroundImageFix"/>
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
              <feGaussianBlur stdDeviation="200" result="effect1_foregroundBlur_68_8252"/>
            </filter>
          </defs>
        </svg>
      </div>
      
      {/* Left Sidebar */}
      <div className={`${isCollapsed ? 'w-12' : 'w-56'} bg-white/95 backdrop-blur-sm border-r border-gray-200 flex flex-col relative z-10 transition-all duration-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && <img src="/assets/Logobigger.webp" alt="Stylist" className="h-5 sm:h-4.5 w-auto" />}
            <img 
              src="/assets/Collapse.svg" 
              alt="Collapse" 
              className="w-5 h-5 cursor-pointer hover:opacity-70 transition-opacity" 
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
          </div>
        </div>

        {/* New Chat Button */}
        {!isCollapsed && (
          <div className="p-4">
            <Link href="/chat">
              <Button className="w-full bg-black hover:bg-gray-800 text-white rounded-lg py-2 text-sm font-medium flex items-center justify-start">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <defs>
                    <linearGradient id="plusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7D8FE2" />
                      <stop offset="100%" stopColor="#7D8FE2" />
                    </linearGradient>
                  </defs>
                  <path d="M12 5V19M5 12H19" stroke="url(#plusGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New Chat
              </Button>
            </Link>
          </div>
        )}

        {/* Saved Moodboards Section */}
        {!isCollapsed && (
          <div className="px-4 pb-2">
            <Link 
              href="/gallery" 
              className="block text-sm hover:text-gray-800 transition-colors relative"
              onClick={() => {
                // Clear completion status when navigating to gallery
                if (completedMoodboards.size > 0) {
                  Array.from(completedMoodboards).forEach(boardId => {
                    clearCompletedStatus(boardId);
                  });
                }
              }}
            >
              <div className="flex items-center gap-2">
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
              </div>
              
              {/* Breakdown counts */}
              {(() => {
                const manualCount = moodboards.filter(board => !board.isAutoGenerated).length;
                const autoCount = moodboards.filter(board => board.isAutoGenerated).length;
                
                if (manualCount + autoCount === 0) return null;
                
                return (
                  <div className="mt-1 ml-6 space-y-0.5 text-xs text-gray-500">
                    {manualCount > 0 && (
                      <div className="flex items-center gap-1">
                        <span>Your boards: {manualCount}</span>
                      </div>
                    )}
                    {autoCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span>AI boards: {autoCount}</span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </Link>
          </div>
        )}

        {/* Mode Selector - Better position before chat history */}
        {!isCollapsed && <ModeSelector />}

        {/* Chat History */}
        {!isCollapsed && (
          <div className="px-4 py-2 flex-1 overflow-y-auto">
            <h3 className="text-xs font-medium text-gray-500 mb-3">Recent Chats</h3>
            <div className="space-y-1">
              {chatSessions.length === 0 ? (
                <div className="text-center text-gray-400 text-xs py-4">
                  <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p>No chats yet</p>
                </div>
              ) : (
                chatSessions
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 6) // Show only recent 6 chats
                  .map(session => (
                    <div key={session.id} className="relative group">
                      <Link href={`/chat/${session.id}`}>
                        <div className="text-sm text-gray-700 py-2 px-2 rounded hover:bg-gray-100 transition-colors cursor-pointer truncate">
                          {session.title}
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                        onClick={(e) => handleDeleteChat(e, session.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
            {chatSessions.length > 6 && (
              <Link href="/chat" className="block text-xs text-blue-600 hover:text-blue-800 mt-2 px-2">
                View all chats →
              </Link>
            )}
          </div>
        )}

      </div>

      <main className="flex-1 relative z-10">{children}</main>
    </div>
  );
} 