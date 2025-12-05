import { useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useConversationStore } from '../../stores/conversationStore';
import { useUIStore } from '../../stores/uiStore';
import Button from '../common/Button';
import MessageList from './MessageList';
import InputArea from './InputArea';

interface ChatPanelProps {
  className?: string;
  style?: CSSProperties;
}

export default function ChatPanel({ className = '', style }: ChatPanelProps) {
  const loadHistory = useChatStore(state => state.loadHistory);
  const clearHistory = useChatStore(state => state.clearHistory);
  const isLoading = useChatStore(state => state.isLoading);
  const initConversations = useConversationStore(state => state.init);
  const activeConversationId = useConversationStore(state => state.activeId);
  const openConfirm = useUIStore(state => state.openConfirm);
  const setLoading = useUIStore(state => state.setLoading);
  const showToast = useUIStore(state => state.showToast);

  useEffect(() => {
    initConversations();
  }, [initConversations]);

  useEffect(() => {
    if (!activeConversationId) return;
    loadHistory();
  }, [activeConversationId, loadHistory]);

  const handleClearConversation = () => {
    openConfirm({
      title: '清空当前对话？',
      description: '该操作会删除当前会话的全部聊天记录且无法恢复，请谨慎操作。',
      confirmText: '立即清空',
      cancelText: '暂不',
      danger: true,
      onConfirm: async () => {
        setLoading(true, '正在清空对话...');
        try {
          const success = await clearHistory();
          showToast({
            type: success ? 'success' : 'error',
            message: success ? '对话记录已清空' : '清空失败，请稍后重试'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

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
        <div className="flex items-center gap-3">
          {isLoading && (
            <div className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-400">
              AI 正在思考...
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={handleClearConversation}>
            清空对话
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <MessageList />
      </div>

      <InputArea />
    </div>
  );
}
