import { useEffect } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useConversationStore } from '../../stores/conversationStore';
import MessageList from './MessageList';
import InputArea from './InputArea';

export default function ChatPanel() {
  const loadHistory = useChatStore(state => state.loadHistory);
  const clearHistory = useChatStore(state => state.clearHistory);
  const isLoading = useChatStore(state => state.isLoading);
  const initConversations = useConversationStore(state => state.init);
  const activeConversationId = useConversationStore(state => state.activeId);

  useEffect(() => {
    initConversations();
  }, [initConversations]);

  useEffect(() => {
    loadHistory();
  }, [activeConversationId, loadHistory]);

  return (
    <div className="flex-1 flex flex-col min-w-[420px] bg-white border-x border-gray-100">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-white via-white to-blue-50/40">
        <div className="flex items-center gap-2 text-gray-800 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            💬
          </span>
          <div>
            <div className="leading-none">对话交互</div>
            <div className="text-xs text-gray-400 mt-1">Chat Module · RAG 助手</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => clearHistory()}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 disabled:opacity-50"
          >
            清空记录
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList />
      </div>
      <InputArea />
    </div>
  );
}
