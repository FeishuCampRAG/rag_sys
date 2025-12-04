import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useConversationStore } from '../../stores/conversationStore';
import MessageList from './MessageList';
import InputArea from './InputArea';

interface ChatPanelProps {
  className?: string;
  style?: CSSProperties;
}

export default function ChatPanel({ className = '', style }: ChatPanelProps) {
  const loadHistory = useChatStore(state => state.loadHistory);
  const isLoading = useChatStore(state => state.isLoading);
  const initConversations = useConversationStore(state => state.init);
  const activeConversationId = useConversationStore(state => state.activeId);

  useEffect(() => {
    initConversations();
  }, [initConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadHistory();
  }, [activeConversationId, loadHistory]);

  return (
    <div
      style={style}
      className={`flex w-full flex-1 min-h-0 flex-col border-b border-gray-100 bg-white lg:min-w-[420px] lg:border-b-0 lg:border-x lg:shadow-sm ${className}`.trim()}
    >
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-white via-white to-blue-50/40 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 text-gray-800">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-xl leading-none text-blue-600">
            💬
          </span>
          <div className="font-semibold">
            <div className="text-sm leading-none sm:text-base">对话交互</div>
            <div className="mt-1 text-xs font-normal text-gray-400">Chat Module · RAG 助手</div>
          </div>
        </div>
        {isLoading && (
          <div className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-400">
            AI 正在思考...
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList />
      </div>

      <InputArea />
    </div>
  );
}
