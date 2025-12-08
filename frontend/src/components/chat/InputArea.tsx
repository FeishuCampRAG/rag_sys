import { useState, FormEvent, KeyboardEvent } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useRagStore } from '../../stores/ragStore';
import { useConversationStore } from '../../stores/conversationStore';

export default function InputArea() {
  const [input, setInput] = useState('');
  const { isLoading, sendMessage, stopGeneration } = useChatStore();
  const { reset, setQuery, updateStep } = useRagStore();
  const activeConversationId = useConversationStore(state => state.activeId);
  const isDisabled = !activeConversationId;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading || isDisabled) return;

    const message = input.trim();
    setInput('');
    reset();
    setQuery(message);

    await sendMessage(message, (evt, data) => {
      updateStep(evt, data);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event as unknown as FormEvent<HTMLFormElement>);
    }
  };

  const helperMessage = isDisabled
    ? '暂无会话，请在左侧新建会话后开始聊天'
    : isLoading
      ? 'AI 正在输出，点击停止结束生成'
      : '输入问题，按 Enter 发送；Shift+Enter 换行';

  return (
    <div className="border-t border-gray-100 bg-white/95 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <div className="mb-2 flex flex-col gap-1 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
            <span>{helperMessage}</span>
            {isLoading && !isDisabled && <span className="text-blue-500">AI 正在输出回答...</span>}
          </div>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDisabled ? '请先新建会话' : '例如：总结最新上传的报告，并标注出处'}
            disabled={isDisabled || isLoading}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
        {isLoading ? (
          <button
            type="button"
            onClick={stopGeneration}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-600 disabled:cursor-not-allowed md:w-auto"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6h12v12H6z" />
            </svg>
            停止生成
          </button>
        ) : (
          <button
            type="submit"
            disabled={isDisabled || !input.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-auto"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            发送
          </button>
        )}
      </form>
    </div>
  );
}
