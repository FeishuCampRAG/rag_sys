import StepCard from './StepCard';
import ChunkPreview from './ChunkPreview';
import Button from '../common/Button';
import type { RetrievalStepProps } from '../../types';

export default function RetrievalStep({
  status,
  chunks,
  errorMessage,
  onSelectChunk,
  onViewAllChunks
}: RetrievalStepProps) {
  const hasChunks = chunks.length > 0;

  return (
    <StepCard
      step={3}
      title={`检索结果${hasChunks ? ` (Top ${chunks.length})` : ''}`}
      status={status}
    >
      {status === 'pending' && (
        <p className="mt-2 text-xs text-gray-400">等待向量检索开始。</p>
      )}
      {status === 'processing' && (
        <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
          <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
          检索中，正在匹配最相似的内容...
        </div>
      )}
      {status === 'done' && (
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
                    查看全部片段
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">未检索到匹配的知识片段。</p>
          )}
        </div>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-red-600">
          {errorMessage || '检索阶段失败，请检查向量索引服务。'}
        </p>
      )}
    </StepCard>
  );
}
