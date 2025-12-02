import { useEffect } from 'react';
import { useConversationStore } from '../../stores/conversationStore';
import { useChatStore } from '../../stores/chatStore';

const formatTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', { hour12: false });
};

export default function ConversationSidebar() {
  const { conversations, activeId, init, createConversation, selectConversation, deleteConversation } = useConversationStore();
  const loadHistory = useChatStore(state => state.loadHistory);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    loadHistory();
  }, [activeId, loadHistory]);

  return (
    <div className="w-72 min-w-[260px] bg-white border-r border-gray-200 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">对话管理</div>
          <div className="text-xs text-gray-400">记录每轮提问的概要</div>
        </div>
        <button
          onClick={async () => {
            const newId = await createConversation();
            selectConversation(newId);
          }}
          className="h-8 px-3 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors"
        >
          新对话
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {conversations.map(conv => {
          const isActive = conv.id === activeId;
          const messageCount = conv.messages?.length ?? 0;
          return (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`border rounded-lg p-3 cursor-pointer transition-all relative group ${
                isActive
                  ? 'border-blue-200 bg-blue-50/60 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-blue-100 hover:shadow-sm'
              }`}
            >
              <button
                className="absolute top-2 right-2 p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conv.id);
                }}
                aria-label="删除对话"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[12px] text-gray-500 font-medium">对话记录</div>
                <div className="text-[11px] text-gray-400">{formatTime(conv.updated_at)}</div>
              </div>
              <div
                className="text-sm font-semibold text-gray-800 mb-1 overflow-hidden"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
              >
                {conv.summary || '等待提问以生成概要'}
              </div>
              <div className="text-xs text-gray-500 leading-5">
                {messageCount > 0 ? `${messageCount} 条消息` : '尚未提问'}
              </div>
            </div>
          );
        })}

        {conversations.length === 0 && (
          <div className="text-center text-gray-400 text-sm py-10">
            暂无对话，点击“新对话”开始
          </div>
        )}
      </div>
    </div>
  );
}
