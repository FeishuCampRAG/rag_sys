import Button from '../common/Button';
import { useChatStore } from '../../stores/chatStore';
import { useUIStore } from '../../stores/uiStore';

interface HeaderProps {
  variant?: 'chat' | 'knowledge';
}

export default function Header({ variant = 'chat' }: HeaderProps) {
  const clearHistory = useChatStore(state => state.clearHistory);
  const openConfirm = useUIStore(state => state.openConfirm);
  const setLoading = useUIStore(state => state.setLoading);
  const showToast = useUIStore(state => state.showToast);

  const openKnowledgeBase = () => {
    window.open('/kb', variant === 'chat' ? '_blank' : '_self');
  };

  const goHome = () => {
    if (variant === 'knowledge') {
      window.open('/', '_self');
    }
  };

  const handleClearConversation = () => {
    if (variant !== 'chat') return;
    openConfirm({
      title: '清空当前对话？',
      description: '该操作会删除当前会话中的全部聊天记录，且无法恢复，请谨慎操作。',
      confirmText: '立即清空',
      cancelText: '暂不',
      danger: true,
      onConfirm: async () => {
        setLoading(true, '正在清空对话...');
        try {
          const success = await clearHistory();
          if (success) {
            showToast({ type: 'success', message: '对话记录已清空' });
          } else {
            showToast({ type: 'error', message: '清空失败，请稍后重试' });
          }
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const subtitle = variant === 'knowledge' ? '知识库管理端' : '知识库演示系统';
  const canNavigateHome = variant === 'knowledge';

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={goHome}
        className={`group flex items-center gap-2 rounded-md px-1 py-1 transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          canNavigateHome ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        }`}
        disabled={!canNavigateHome}
        aria-label="返回首页"
      >
        <span className="text-xl font-bold text-blue-600">RAG</span>
        <span className="hidden text-sm text-gray-600 sm:inline">{subtitle}</span>
      </button>

      {variant === 'chat' ? (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClearConversation}>
            清空对话
          </Button>
          <Button size="sm" onClick={openKnowledgeBase}>
            知识库管理
          </Button>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={goHome}>
          返回对话窗口
        </Button>
      )}
    </header>
  );
}
