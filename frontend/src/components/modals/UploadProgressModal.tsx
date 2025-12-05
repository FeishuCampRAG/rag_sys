import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from '../common/Button';
import StepCard from '../rag/StepCard';
import { useUIStore } from '../../stores/uiStore';
import type { StepStatus } from '../../types';

const steps = [
  { index: 0, title: '文件上传' },
  { index: 1, title: '内容解析' },
  { index: 2, title: '内容切分' },
  { index: 3, title: '向量构建' },
  { index: 4, title: '完成' }
];

export default function UploadProgressModal() {
  const { uploadProgress, closeUploadProgress } = useUIStore(state => ({
    uploadProgress: state.uploadProgress,
    closeUploadProgress: state.closeUploadProgress
  }));

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || typeof document === 'undefined' || !uploadProgress.open) {
    return null;
  }

  const { completed, result, currentStep, documentName } = uploadProgress;
  const isError = result === 'error';

  const getStepStatus = (index: number): StepStatus => {
    if (completed) {
      if (index < currentStep) return 'done';
      if (index === currentStep) return isError ? 'error' : 'done';
      return isError ? 'pending' : 'done';
    }

    if (index < currentStep) return 'done';
    if (index === currentStep) return 'processing';
    return 'pending';
  };

  const renderStepMessage = (index: number) => {
    if (index === 0) {
      return (
        <div className="mt-1 text-xs text-blue-600">
          {currentStep === 0 && !completed ? '上传中...' : '上传完成'}
        </div>
      );
    }

    if (!completed) {
      if (index === currentStep) {
        return (
          <div className="mt-1 text-xs text-blue-600">
            处理中...
          </div>
        );
      }
      if (index > currentStep) {
        return (
          <div className="mt-1 text-xs text-gray-400">
            等待前序步骤完成...
          </div>
        );
      }
    }

    if (index === 4) {
      if (!completed) {
        return (
          <div className="mt-1 text-xs text-gray-400">
            等待前序步骤完成...
          </div>
        );
      }
      return (
        <div className={`mt-1 text-xs ${isError ? 'text-red-600' : 'text-green-600'}`}>
          {isError ? '上传或处理失败，请稍后重试。' : '处理完成，可以开始检索与问答。'}
        </div>
      );
    }

    return null;
  };

  const displayName = documentName || '正在处理的文档';
  const canClose = completed;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-gray-900/50 px-4 py-10 sm:py-16">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-gray-100 px-6 py-5">
          <p className="text-sm font-semibold text-gray-500">上传进度</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-800">{displayName}</h3>
          <p className="mt-2 text-xs text-gray-500">
            {completed
              ? isError
                ? '文档处理失败，请检查文件后重试。'
                : '文档已成功处理完毕，可以继续检索和问答。'
              : '系统正在处理文档，请勿关闭窗口。'}
          </p>
        </div>

        <div className="max-h-[60vh] space-y-3 overflow-y-auto px-6 py-5">
          {steps.map(({ index, title }) => (
            <StepCard key={title} step={index + 1} title={title} status={getStepStatus(index)}>
              {renderStepMessage(index)}
            </StepCard>
          ))}
        </div>

        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <Button
            variant={canClose && !isError ? 'primary' : isError ? 'danger' : 'outline'}
            size="sm"
            onClick={closeUploadProgress}
            disabled={!canClose}
          >
            {canClose ? (isError ? '我知道了' : '完成') : '处理中...'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
