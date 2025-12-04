import { useEffect, useState } from 'react';
import StepCard from './StepCard';
import { PromptStepProps } from '../../types';

export default function PromptStep({ status, prompt, errorMessage }: PromptStepProps) {
  const displayStatus = status;
  const trimmed = prompt.trim();
  const hasPrompt = trimmed.length > 0;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (displayStatus !== 'done') {
      setExpanded(false);
    }
  }, [displayStatus]);

  return (
    <StepCard
      step={4}
      title="Prompt 预览"
      status={displayStatus}
    >
      {displayStatus === 'pending' && (
        <p className="mt-2 text-xs text-gray-400">
          等待拼装提示词。
        </p>
      )}
      {displayStatus === 'processing' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
          Prompt 生成中…
        </div>
      )}
      {displayStatus === 'done' && (
        hasPrompt ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-blue-600 transition hover:text-blue-700"
            >
              {expanded ? '收起' : '展开查看'}
              <svg
                className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expanded && (
              <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                {trimmed}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">当前没有可展示的 Prompt 内容。</p>
        )
      )}
      {displayStatus === 'error' && (
        <p className="mt-2 text-xs text-red-600">
          {errorMessage || 'Prompt 拼装失败，请检查模板配置。'}
        </p>
      )}
    </StepCard>
  );
}
