import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import MessageItem from "./MessageItem";

export default function MessageList() {
  const messages = useChatStore(state => state.messages);
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Check if user is at the bottom of the chat
  const checkIfAtBottom = () => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 50px of the bottom
    return Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
  };

  // Handle scroll events to detect user scrolling
  const handleScroll = () => {
    if (!containerRef.current) return;
    const atBottom = checkIfAtBottom();
    setIsAtBottom(atBottom);
    
    // If user scrolls up, mark as user scrolling
    if (!atBottom) {
      setIsUserScrolling(true);
    } else {
      setIsUserScrolling(false);
    }
  };

  // Auto-scroll only when at the bottom
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Only auto-scroll if user is at the bottom or not manually scrolling
    if (isAtBottom && !isUserScrolling) {
      requestAnimationFrame(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isAtBottom, isUserScrolling]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <p>开始对话，探索知识库</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto bg-white px-4 py-4"
      onScroll={handleScroll}
    >
      {messages.map(message => (
        <MessageItem key={message.id || message.created_at} message={message} />
      ))}
      <div ref={endRef} />
    </div>
  );
}

