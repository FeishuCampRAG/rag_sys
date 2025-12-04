import StepCard from './StepCard';
import ChunkPreview from './ChunkPreview';
import Button from '../common/Button';
import { RetrievalStepProps } from '../../types';

export default function RetrievalStep({
  status,
  chunks,
  errorMessage,
  onSelectChunk,
  onViewAllChunks
}: RetrievalStepProps) {
  const displayStatus = status;
  const hasChunks = chunks.length > 0;

  return (
    <StepCard
      step={3}
      title={`检索结果${hasChunks ? ` (Top ${chunks.length})` : ''}`}
      status={displayStatus}
    >
      {displayStatus === 'pending' && (
        <p className="mt-2 text-xs text-gray-400">等待向量检索开始。</p>
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
            <>
              {chunks.map((chunk, index) => (
                <ChunkPreview
                  key={chunk.id ?? `${index}`}
                  chunk={chunk}
                  index={index}
                  onSelect={onSelectChunk ? () => onSelectChunk(index) : undefined}
                />
              ))}
              {onViewAllChunks && (
                <div className="pt-1 text-right">
                  <Button variant="outline" size="sm" onClick={onViewAllChunks}>
                    查看全部 Chunks
                  </Button>
                </div>
              )}
            </>
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
