import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useConversationStore } from '../../stores/conversationStore';
import { useChatStore } from '../../stores/chatStore';

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', { hour12: false });
};

interface ConversationSidebarProps {
  className?: string;
  style?: CSSProperties;
}

export default function ConversationSidebar({ className = '', style }: ConversationSidebarProps) {
  const { conversations, activeId, init, createConversation, selectConversation, deleteConversation } = useConversationStore();
  const loadHistory = useChatStore(state => state.loadHistory);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    loadHistory();
  }, [activeId, loadHistory]);

  return (
    <div
      style={style}
      className={`flex w-full flex-col border-b border-gray-200 bg-white lg:h-full lg:w-72 lg:min-w-[260px] lg:border-b-0 lg:border-r lg:shadow-sm ${className}`.trim()}
    >
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <div className="text-sm font-semibold text-gray-800">对话管理</div>
          <div className="text-xs text-gray-400">记录每轮提问的概要</div>
        </div>
        <button
          onClick={async () => {
            const newId = await createConversation();
            selectConversation(newId);
          }}
          className="h-8 rounded-md bg-blue-600 px-3 text-xs text-white transition-colors hover:bg-blue-500"
        >
          新对话
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {conversations.map(conv => {
          const isActive = conv.id === activeId;
          const messageCount = conv.messages?.length ?? 0;
          return (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`group relative cursor-pointer rounded-lg border p-3 transition-all ${
                isActive
                  ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-100 hover:shadow-sm'
              }`}
            >
              <button
                className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                aria-label="删除对话"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="mb-1 flex items-center justify-between gap-2">
                <div className="text-[12px] font-medium text-gray-500">对话记录</div>
                <div className="text-[11px] text-gray-400">{formatTime(conv.updated_at)}</div>
              </div>
              <div
                className="mb-1 overflow-hidden text-sm font-semibold text-gray-800"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {conv.summary || '待提问以生成概要'}
              </div>
              <div className="text-xs leading-5 text-gray-500">
                {messageCount > 0 ? `${messageCount} 条消息` : '尚未提问'}
              </div>
            </div>
          );
        })}

        {conversations.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">
            暂无对话，点击“新对话”开始
          </div>
        )}
      </div>
    </div>
  );
}
