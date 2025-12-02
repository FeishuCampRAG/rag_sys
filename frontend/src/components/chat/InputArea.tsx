import { useState, FormEvent, KeyboardEvent } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useRagStore } from '../../stores/ragStore';

export default function InputArea() {
  const [input, setInput] = useState('');
  const { isLoading, sendMessage } = useChatStore();
  const { reset, setQuery, updateStep } = useRagStore();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    reset();
    setQuery(message);

    await sendMessage(message, (event, data) => {
      updateStep(event, data);
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="border-t border-gray-100 bg-white/95 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <div className="mb-2 flex flex-col gap-1 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <span>输入问题，按 Enter 发送 · Shift+Enter 换行</span>
            {isLoading && <span className="text-blue-500">AI 正在思考...</span>}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="例如：总结最新上传的报告，并标注出处"
            disabled={isLoading}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-auto"
        >
          {isLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              生成中...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              发送
            </>
          )}
        </button>
      </form>
    </div>
  );
}
