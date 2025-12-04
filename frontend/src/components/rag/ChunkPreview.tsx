import { ChunkPreviewProps } from '../../types';

export default function ChunkPreview({ chunk, index }: ChunkPreviewProps) {
  return (
    <div className="p-2 bg-white rounded border border-gray-200 text-xs">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 truncate">
          <span className="font-mono text-[11px] text-gray-400">#{index + 1}</span>
          <span className="font-medium text-gray-700 truncate">
            {chunk.document_name}
          </span>
        </div>
        <span className="ml-2 font-medium text-blue-600">
          {chunk.similarity.toFixed(2)}
        </span>
      </div>
      <p className="text-gray-600 line-clamp-3">
        {chunk.content}
      </p>
    </div>
  );
}
