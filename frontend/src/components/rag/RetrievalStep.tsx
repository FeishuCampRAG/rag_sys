import StepCard from './StepCard';
import ChunkPreview from './ChunkPreview';
import { RetrievalStepProps } from '../../types';

export default function RetrievalStep({ status, chunks, errorMessage }: RetrievalStepProps) {
  const displayStatus = status;
  const hasChunks = chunks.length > 0;

  return (
    <StepCard
      step={3}
      title={`检索结果${hasChunks ? ` (Top ${chunks.length})` : ''}`}
      status={displayStatus}
    >
      {displayStatus === 'pending' && (
        <p className="mt-2 text-xs text-gray-400">
          等待向量检索开始。
        </p>
      )}
      {displayStatus === 'processing' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
          检索 Top-K 相关内容中…
        </div>
      )}
      {displayStatus === 'done' && (
        <div className="mt-2 space-y-2">
          {hasChunks ? (
            chunks.map((chunk, index) => (
              <ChunkPreview key={chunk.id ?? `${index}`} chunk={chunk} index={index} />
            ))
          ) : (
            <p className="text-xs text-gray-500">未检索到匹配的知识片段。</p>
          )}
        </div>
      )}
      {displayStatus === 'error' && (
        <p className="mt-2 text-xs text-red-600">
          {errorMessage || '检索阶段失败，请检查向量索引服务。'}
        </p>
      )}
    </StepCard>
  );
}
