import { useRef, useState, ChangeEvent } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { useConfirm } from '../../hooks/useConfirm';
import { useToast } from '../../hooks/useToast';

export default function UploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadDocument, documents, deleteDocument } = useDocumentStore();
  const [error, setError] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const confirm = useConfirm();
  const toast = useToast();

  const handleClick = () => {
    if (!uploading && !deletingAll) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);

    const emptyFiles: string[] = [];
    const invalidTypeFiles: string[] = [];
    const failedFiles: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size === 0) {
        emptyFiles.push(file.name);
        continue;
      }

      if (!/\.(pdf|txt|md)$/i.test(file.name)) {
        invalidTypeFiles.push(file.name);
        continue;
      }

      try {
        const result = await uploadDocument(file);
        if (!result?.success) {
          failedFiles.push(file.name);
        }
      } catch {
        failedFiles.push(file.name);
      }
    }

    if (emptyFiles.length > 0) {
      setError(`以下文件内容为空或无效：${emptyFiles.join('、')}`);
    } else if (invalidTypeFiles.length > 0) {
      setError(`以下文件类型不支持，仅支持 PDF / TXT / MD：${invalidTypeFiles.join('、')}`);
    } else if (failedFiles.length > 0) {
      setError(`以下文件上传失败，请稍后重试：${failedFiles.join('、')}`);
    }

    event.target.value = '';
  };

  const handleDeleteAll = async () => {
    if (!documents || documents.length === 0) {
      setError('当前没有可删除的文档');
      return;
    }

    const confirmed = await confirm({
      title: '删除全部文档',
      message: '确认一键删除所有已上传文档吗？此操作不可恢复，请谨慎操作。',
      confirmText: '立即删除',
      cancelText: '暂不',
      danger: true
    });
    if (!confirmed) return;

    setError(null);
    setDeletingAll(true);
    try {
      for (const doc of documents) {
        await deleteDocument(doc.id);
      }
      toast({
        type: 'success',
        title: '删除成功',
        message: '已清空上传的全部文档'
      });
    } catch {
      setError('删除失败，请稍后重试');
      toast({
        type: 'error',
        title: '删除失败',
        message: '删除过程中出现问题，请稍后再试'
      });
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={uploading || deletingAll}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
      >
        {uploading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            正在上传...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            上传文档
          </>
        )}
      </button>
      <button
        type="button"
        onClick={handleDeleteAll}
        disabled={uploading || deletingAll}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {deletingAll ? '正在删除所有文档...' : '删除所有上传文档'}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
          <svg className="mt-[1px] h-3.5 w-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l6.518 11.59C19.02 16.42 18.245 18 16.773 18H3.227C1.755 18 .98 16.42 1.739 14.69l6.518-11.59zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </>
  );
}
