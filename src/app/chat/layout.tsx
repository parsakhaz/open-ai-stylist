import { ChatSidebar } from '@/components/chat-sidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full">
      <ChatSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
} 