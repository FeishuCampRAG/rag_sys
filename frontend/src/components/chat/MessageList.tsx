import { useEffect, useRef, useState, useCallback } from "react";
import { useChatStore } from "../../stores/chatStore";
import MessageItem from "./MessageItem";

export default function MessageList() {
  const messages = useChatStore(state => state.messages);
  const containerRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollHeightRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Check if user is at the bottom of the chat
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider "at bottom" if within 100px of the bottom (increased threshold)
    return Math.abs(scrollHeight - scrollTop - clientHeight) < 100;
  }, []);

  // Handle scroll events to detect user scrolling
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    
    const currentScrollTop = containerRef.current.scrollTop;
    const currentScrollHeight = containerRef.current.scrollHeight;
    const atBottom = checkIfAtBottom();
    
    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Detect if this is a content height change vs user scroll
    const isContentHeightChange = currentScrollHeight > lastScrollHeightRef.current;
    const isUserScrollingUp = currentScrollTop < lastScrollTopRef.current - 5; // Threshold for actual user scroll
    
    // Update refs for next comparison
    lastScrollHeightRef.current = currentScrollHeight;
    lastScrollTopRef.current = currentScrollTop;
    
    // Only mark as user scrolling if it's not a content height change and user is actually scrolling up
    if (!isContentHeightChange && isUserScrollingUp && !atBottom) {
      setIsUserScrolling(true);
      setIsAtBottom(false);
    } else if (atBottom) {
      setIsAtBottom(true);
      // Reset user scrolling state when at bottom
      scrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
      }, 150); // Small delay to ensure smooth transition
    }
  }, [checkIfAtBottom]);

  // Auto-scroll logic with improved handling for content changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Always scroll to bottom for new messages if user was at bottom or if it's a streaming message
    const shouldAutoScroll = isAtBottom || messages.some(msg => msg.streaming);
    
    if (shouldAutoScroll && !isUserScrolling) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      requestAnimationFrame(() => {
        if (containerRef.current && endRef.current) {
          // Check if we're still at bottom after potential content changes
          const stillAtBottom = checkIfAtBottom();
          if (stillAtBottom || messages.some(msg => msg.streaming)) {
            endRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }
      });
    }
  }, [messages, isAtBottom, isUserScrolling, checkIfAtBottom]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
