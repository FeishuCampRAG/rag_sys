import { useMemo } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

export default function DocumentViewer() {
  const { selectedDocId, selectedDocContent, selectedDocLoading, selectedDocError, documents } = useDocumentStore();
  const activeDoc = useMemo(() => documents.find(doc => doc.id === selectedDocId), [documents, selectedDocId]);

  if (!activeDoc) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        点击左侧文档可查看具体内容
      </div>
    );
  }

  const statusConfig = {
    processing: {
      label: '处理中',
      badge: 'bg-yellow-50 text-yellow-700 border-yellow-100'
    },
    ready: {
      label: '已就绪',
      badge: 'bg-green-50 text-green-700 border-green-100'
    },
    error: {
      label: '失败',
      badge: 'bg-red-50 text-red-700 border-red-100'
    }
  } as const;

  const status = statusConfig[activeDoc.status] || statusConfig.processing;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">当前文档</p>
          <h3 className="text-base font-medium text-gray-900">{activeDoc.original_name}</h3>
          {activeDoc.status === 'processing' && (
            <p className="mt-1 text-xs text-yellow-700">
              文档仍在处理中，可提前预览原始内容
            </p>
          )}
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${status.badge}`}>
          {status.label}
        </span>
      </div>

      <div className="mt-4 h-[420px] overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-4">
        {selectedDocLoading && (
          <p className="text-sm text-gray-600">正在加载《{activeDoc.original_name}》的完整内容…</p>
        )}

        {!selectedDocLoading && selectedDocError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            加载失败：{selectedDocError}
          </div>
        )}

        {!selectedDocLoading && !selectedDocError && selectedDocContent && (
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">
            {selectedDocContent}
          </pre>
        )}

        {!selectedDocLoading && !selectedDocError && !selectedDocContent && (
          <div className="text-center text-sm text-gray-400">暂无可展示的内容</div>
        )}
      </div>
    </div>
  );
}
