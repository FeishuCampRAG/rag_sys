import Button from '../common/Button';

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
        <Button size="sm" onClick={openKnowledgeBase}>
          知识库管理
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={goHome}>
          返回对话窗口
        </Button>
      )}
    </header>
  );
}
