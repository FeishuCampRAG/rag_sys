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

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-2 cursor-pointer" onClick={goHome}>
        <span className="text-xl font-bold text-blue-600">RAG</span>
        <span className="text-gray-600">
          {variant === 'knowledge' ? '知识库管理窗口' : '知识库演示系统'}
        </span>
      </div>

      {variant === 'chat' ? (
        <button
          onClick={openKnowledgeBase}
          className="h-9 px-4 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          知识库管理
        </button>
      ) : (
        <button
          onClick={goHome}
          className="h-9 px-4 text-sm rounded-md border border-gray-200 text-gray-700 hover:border-blue-200 hover:text-blue-600 transition-colors"
        >
          返回对话窗口
        </button>
      )}
    </header>
  );
}
