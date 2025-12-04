import type React from 'react';
import { ChunkPreviewProps } from '../../types';

export default function ChunkPreview({ chunk, index, onSelect }: ChunkPreviewProps) {
  const isInteractive = typeof onSelect === 'function';

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isInteractive) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.();
    }
  };

  const baseClasses = isInteractive
    ? 'cursor-pointer border-blue-100 bg-white shadow-sm hover:border-blue-200 hover:shadow-md'
    : 'border-gray-200 bg-white';

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      className={`rounded border p-3 text-xs transition ${baseClasses}`}
      aria-label={isInteractive ? `查看 Chunk ${index + 1}` : undefined}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="font-mono text-[11px] text-gray-400">#{index + 1}</span>
          <span className="flex-1 truncate font-medium text-gray-700">{chunk.document_name}</span>
        </div>
        <span className="ml-2 font-semibold text-blue-600">{chunk.similarity.toFixed(2)}</span>
      </div>
      <p className="line-clamp-3 text-gray-600">{chunk.content}</p>
      {isInteractive && (
        <span className="mt-2 inline-flex text-[11px] text-blue-500">点击查看详情</span>
      )}
    </div>
  );
}
