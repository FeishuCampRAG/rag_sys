import StepCard from './StepCard';
import { GeneratingStepProps } from '../../types';

export default function GeneratingStep({ status, generating, tokens, errorMessage }: GeneratingStepProps) {
  const hasContent = tokens.trim().length > 0;

  return (
    <StepCard
      step={5}
      title="生成答案"
      status={status}
    >
      {status === 'pending' && (
        <p className="mt-2 text-xs text-gray-400">
          等待模型开始生成回复。
        </p>
      )}
      {(status === 'processing' || generating) && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
          模型生成中…
        </div>
      )}
      {status === 'done' && !hasContent && (
        <p className="mt-2 text-xs text-green-600">
          生成完成。
        </p>
      )}
      {status !== 'error' && hasContent && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded border border-green-100 bg-white px-3 py-2 text-xs text-gray-600">
          {tokens}
        </div>
      )}
      {status === 'error' && (
        <div className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
          {errorMessage || '生成失败，请稍后重试。'}
        </div>
      )}
    </StepCard>
  );
}
