'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// This page's sole purpose is to create a new chat ID and redirect.
export default function NewChatPage() {
  const router = useRouter();

  useEffect(() => {
    const newChatId = uuidv4();
    // Don't add to chat sessions yet - only add when user sends first message
    router.replace(`/chat/${newChatId}`);
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <p className="animate-pulse">Starting a new chat...</p>
    </div>
  );
} 