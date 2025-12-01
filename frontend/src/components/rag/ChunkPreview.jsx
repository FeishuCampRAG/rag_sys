export default function ChunkPreview({ chunk, index }) {
  return (
    <div className="p-2 bg-white rounded border border-gray-200 text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-gray-700 truncate flex-1">
          {chunk.document_name}
        </span>
        <span className="text-blue-600 font-medium ml-2">
          {chunk.similarity.toFixed(2)}
        </span>
      </div>
      <p className="text-gray-600 line-clamp-3">
        {chunk.content}
      </p>
    </div>
  );
}
