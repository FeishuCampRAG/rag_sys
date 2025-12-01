import { useDocumentStore } from '../../stores/documentStore';

export default function DocumentItem({ document }) {
  const { selectedDocId, selectDocument, deleteDocument } = useDocumentStore();
  const isSelected = selectedDocId === document.id;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm(`确定删除 "${document.original_name}" 吗？`)) {
      deleteDocument(document.id);
    }
  };

  const statusConfig = {
    processing: { text: '处理中', color: 'text-yellow-600', icon: 'animate-spin' },
    ready: { text: '已就绪', color: 'text-green-600', icon: '' },
    error: { text: '失败', color: 'text-red-600', icon: '' }
  };

  const status = statusConfig[document.status] || statusConfig.processing;

  return (
    <div
      onClick={() => selectDocument(isSelected ? null : document.id)}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-white hover:bg-gray-100 border border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-800 truncate">
              {document.original_name}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs">
            <span className="text-gray-500">{document.chunk_count} chunks</span>
            <span className={status.color}>{status.text}</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
