import { useChatStore } from '../../stores/chatStore';
import { useRagStore } from '../../stores/ragStore';

export default function Header() {
  const clearHistory = useChatStore(state => state.clearHistory);
  const resetRag = useRagStore(state => state.reset);

  const handleClear = () => {
    clearHistory();
    resetRag();
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-blue-600">RAG</span>
        <span className="text-gray-600">知识库演示系统</span>
      </div>
      <button
        onClick={handleClear}
        className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
      >
        清空对话
      </button>
    </header>
  );
}
