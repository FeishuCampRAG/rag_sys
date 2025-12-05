import { MouseEvent } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import type { Document } from '../../types';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';

interface DocumentItemProps {
  document: Document;
}

export default function DocumentItem({ document }: DocumentItemProps) {
  const { selectedDocId, selectDocument, deleteDocument } = useDocumentStore();
  const isSelected = selectedDocId === document.id;
  const confirm = useConfirm();
  const toast = useToast();

  const handleDelete = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const confirmed = await confirm({
      title: '删除文档',
      message: `确认删除 “${document.original_name}” 吗？该操作不可撤销。`,
      confirmText: '删除',
      cancelText: '取消',
      danger: true
    });
    if (!confirmed) return;

    const result = await deleteDocument(document.id);
    if (result.success) {
      toast({
        type: 'success',
        title: '删除成功',
        message: '文档已删除'
      });
    } else {
      toast({
        type: 'error',
        title: '删除失败',
        message: result.error || '请稍后再试'
      });
    }
  };

  const statusConfig = {
    processing: { text: '处理中', color: 'text-yellow-600' },
    ready: { text: '已就绪', color: 'text-green-600' },
    error: { text: '失败', color: 'text-red-600' }
  } as const;

  const status = statusConfig[document.status] || statusConfig.processing;

  return (
    <div
      onClick={() => selectDocument(isSelected ? null : document.id)}
      className={`cursor-pointer rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-blue-100 hover:bg-blue-50/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate text-sm font-medium text-gray-800">
              {document.original_name}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-gray-500">{document.chunk_count || 0} 个片段</span>
            <span className={status.color}>{status.text}</span>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="rounded-md p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          aria-label="删除文档"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
