'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '../store/useAppStore';
import { v4 as uuidv4 } from 'uuid';

// This page's sole purpose is to create a new chat session and redirect.
export default function NewChatPage() {
  const router = useRouter();
  const addChatSession = useAppStore(state => state.addChatSession);

  useEffect(() => {
    const newChatId = uuidv4();
    addChatSession(newChatId);
    router.replace(`/chat/${newChatId}`);
  }, [router, addChatSession]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p className="animate-pulse">Starting a new chat...</p>
    </div>
  );
} 