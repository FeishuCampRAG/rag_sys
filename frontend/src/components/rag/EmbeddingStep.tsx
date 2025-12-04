import StepCard from './StepCard';
import { EmbeddingStepProps } from '../../types';

export default function EmbeddingStep({ status, embeddingDone, dimension, errorMessage }: EmbeddingStepProps) {
  const displayStatus = status;

  return (
    <StepCard
      step={2}
      title="Query 向量化"
      status={displayStatus}
    >
      {displayStatus === 'pending' && (
        <p className="mt-2 text-xs text-gray-400">
          等待进入向量化流程。
        </p>
      )}
      {displayStatus === 'processing' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
          向量化处理中…
        </div>
      )}
      {displayStatus === 'done' && embeddingDone && (
        <div className="mt-2 text-xs text-gray-600">
          已完成 · 向量维度：{dimension}
        </div>
      )}
      {displayStatus === 'error' && (
        <p className="mt-2 text-xs text-red-600">
          {errorMessage || '向量化阶段失败，请稍后重试。'}
        </p>
      )}
    </StepCard>
  );
}
