import { useMemo } from 'react';
import { useDocumentStore } from '../../stores/documentStore';
import { Document } from '../../types';
import StepCard from '../rag/StepCard';

export default function UploadProgress() {
  const { documents, uploading } = useDocumentStore(state => ({
    documents: state.documents,
    uploading: state.uploading
  }));

  const activeDoc: Document | undefined = useMemo(
    () => documents.find(doc => doc.status === 'processing' || doc.status === 'error'),
    [documents]
  );

  const status = activeDoc?.status;

  // 如果没有正在上传或处理的文档，则不展示进度
  if (!uploading && !activeDoc) {
    return null;
  }

  const isError = status === 'error';
  const isReady = status === 'ready';

  const steps = [
    { index: 0, step: 1, title: '文件上传' },
    { index: 1, step: 2, title: '内容解析' },
    { index: 2, step: 3, title: '内容切分' },
    { index: 3, step: 4, title: '向量化' },
    { index: 4, step: 5, title: '完成' }
  ];

  const getCurrentIndex = () => {
    if (uploading) return 0;
    if (status === 'processing') return 3; // 解析/切分/向量化阶段
    return 4; // ready 或 error 视为最终阶段
  };

  const currentIndex = getCurrentIndex();

  const getStepStatus = (index: number): 'pending' | 'processing' | 'done' => {
    if (index < currentIndex) return 'done';
    if (index === currentIndex && !isReady) return 'processing';
    return 'pending';
  };

  return (
    <div className="mt-4 space-y-2 rounded-lg bg-gray-50 p-3">
      <div className="text-xs text-gray-500">
        {activeDoc
          ? `当前文档：${activeDoc.original_name}`
          : '正在上传文档...'}
      </div>
      {steps.map(({ index, step, title }) => (
        <StepCard key={step} step={step} title={title} status={getStepStatus(index)}>
          {index === 0 && uploading && (
            <div className="mt-1 text-xs text-blue-600">
              上传中...
            </div>
          )}
          {index === 4 && isReady && (
            <div className="mt-1 text-xs text-green-600">
              处理完成，可以开始检索
            </div>
          )}
          {index === 4 && isError && (
            <div className="mt-1 text-xs text-red-600">
              上传或处理失败
              {activeDoc?.error_message ? `：${activeDoc.error_message}` : '，请重试'}
            </div>
          )}
        </StepCard>
      ))}
    </div>
  );
}
