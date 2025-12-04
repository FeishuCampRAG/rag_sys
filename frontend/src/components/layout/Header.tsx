import { useState } from 'react';
import Button from '../common/Button';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';
import { useChatStore } from '../../stores/chatStore';

interface HeaderProps {
  variant?: 'chat' | 'knowledge';
}

export default function Header({ variant = 'chat' }: HeaderProps) {
  const openKnowledgeBase = () => {
    window.open('/kb', variant === 'chat' ? '_blank' : '_self');
  };

  const goHome = () => {
    if (variant === 'knowledge') {
      window.open('/', '_self');
    }
  };

  const subtitle = variant === 'knowledge' ? '知识库管理端' : '知识库演示系统';
  const canNavigateHome = variant === 'knowledge';

  const confirm = useConfirm();
  const toast = useToast();
  const clearHistory = useChatStore(state => state.clearHistory);
  const [clearing, setClearing] = useState(false);

  const handleClearConversation = async () => {
    if (variant !== 'chat') return;
    const shouldClear = await confirm({
      title: '清空对话',
      message: '确认清空当前对话记录吗？将无法恢复。',
      confirmText: '清空',
      danger: true
    });
    if (!shouldClear) return;

    try {
      setClearing(true);
      await clearHistory();
      toast({
        type: 'success',
        title: '已清空',
        message: '当前对话记录已清空'
      });
    } catch (error) {
      toast({
        type: 'error',
        title: '清空失败',
        message: error instanceof Error ? error.message : '请稍后再试'
      });
    } finally {
      setClearing(false);
    }
  };

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
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearConversation}
            loading={clearing}
          >
            清空对话
          </Button>
          <Button size="sm" onClick={openKnowledgeBase}>
            知识库管理
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="secondary"
          onClick={goHome}
        >
          返回对话窗口
        </Button>
      )}
    </header>
  );
}
