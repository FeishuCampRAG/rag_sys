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

    for (const file of Array.from(files)) {
      // 格式过滤：仅允许 PDF / TXT / MD
      if (!/\.(pdf|txt|md)$/i.test(file.name)) {
        setError('仅支持 PDF / TXT / MD 文件');
        continue;
      }

      const result = await uploadDocument(file);

      if (!result.success) {
        setError(result.error || '上传失败，请稍后重试');
      }
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mt-3 border-2 border-dashed rounded-lg p-3 text-xs text-gray-500 text-center transition-colors ${
        isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white'
      } ${uploading ? 'opacity-70 cursor-not-allowed' : 'cursor-default'}`}
    >
      <div>拖拽一个或多个 PDF / TXT / MD 文件到此区域上传</div>
      <div className="mt-1 text-[11px] text-gray-400">或使用上方按钮选择文件</div>
      {error && (
        <div className="mt-2 text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
