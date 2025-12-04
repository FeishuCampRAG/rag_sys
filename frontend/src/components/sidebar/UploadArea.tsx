import { useState, DragEvent } from 'react';
import { useDocumentStore } from '../../stores/documentStore';

export default function UploadArea() {
  const { uploading, uploadDocument } = useDocumentStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!uploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (uploading) return;

    const files = e.dataTransfer.files;
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
      setError(`以下文件内容为空：${emptyFiles.join('、')}`);
    } else if (invalidTypeFiles.length > 0) {
      setError(`以下文件类型不支持，仅支持 PDF / TXT / MD：${invalidTypeFiles.join('、')}`);
    } else if (failedFiles.length > 0) {
      setError(`以下文件上传失败，请稍后重试：${failedFiles.join('、')}`);
    }
  };

  return (
    <>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`mt-3 rounded-lg border-2 border-dashed p-3 text-center text-xs text-gray-500 transition-colors ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
        } ${uploading ? 'cursor-not-allowed opacity-70' : 'cursor-default'}`}
      >
        <div>拖拽一个或多个 PDF / TXT / MD 文件到此区域上传</div>
        <div className="mt-1 text-[11px] text-gray-400">或者使用上方按钮选择文件</div>
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-1 text-xs text-red-500">
          <svg
            className="mt-[1px] h-3.5 w-3.5 flex-shrink-0"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
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
