import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRagStore } from '../../stores/ragStore';
import StepCard from './StepCard';
import ChunkPreview from './ChunkPreview';

interface RAGProcessPanelProps {
  className?: string;
  style?: CSSProperties;
}

export default function RAGProcessPanel({ className = '', style }: RAGProcessPanelProps) {
  const {
    query,
    currentStep,
    embeddingDone,
    embeddingDimension,
    retrievedChunks,
    prompt,
    generating,
    generatedTokens
  } = useRagStore();

  const [showPrompt, setShowPrompt] = useState(false);

  const getStepStatus = (step: string): 'pending' | 'processing' | 'done' => {
    const steps = ['embedding', 'retrieval', 'prompt', 'generating', 'done'];
    const currentIndex = steps.indexOf(currentStep || '');
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return currentStep === 'done' ? 'done' : 'processing';
    return 'pending';
  };

  return (
    <div
      style={style}
      className={`flex w-full flex-1 min-h-0 flex-col border-t border-gray-200 bg-gray-50 overflow-hidden lg:h-full lg:w-80 lg:min-w-[280px] lg:flex-none lg:border-t-0 lg:border-l lg:shadow-sm ${className}`.trim()}
    >
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            RAG 检索流程
          </h2>

          <div className="space-y-3">
            <StepCard step={1} title="用户问题" status={query ? 'done' : 'pending'}>
              {query && (
                <div className="mt-2 rounded border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  {query}
                </div>
              )}
            </StepCard>

            <StepCard step={2} title="Query 向量化" status={getStepStatus('embedding')}>
              {embeddingDone && (
                <div className="mt-2 text-xs text-gray-500">
                  已完成 · 维度: {embeddingDimension}
                </div>
              )}
            </StepCard>

            <StepCard
              step={3}
              title={`检索结果${retrievedChunks.length > 0 ? ` (Top ${retrievedChunks.length})` : ''}`}
              status={getStepStatus('retrieval')}
            >
              {retrievedChunks.length > 0 && (
                <div className="mt-2 space-y-2">
                  {retrievedChunks.map((chunk, index) => (
                    <ChunkPreview key={chunk.id} chunk={chunk} index={index} />
                  ))}
                </div>
              )}
            </StepCard>

            <StepCard step={4} title="Prompt 组装" status={getStepStatus('prompt')}>
              {prompt && (
                <div className="mt-2">
                  <button
                    onClick={() => setShowPrompt(!showPrompt)}
                    className="flex items-center gap-1 text-xs text-blue-600 transition hover:text-blue-700"
                  >
                    {showPrompt ? '收起' : '展开查看'}
                    <svg
                      className={`h-3 w-3 transition-transform ${showPrompt ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showPrompt && (
                    <div className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                      {prompt}
                    </div>
                  )}
                </div>
              )}
            </StepCard>

            <StepCard step={5} title="生成回答" status={getStepStatus('generating')}>
              {generating && (
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-current" />
                  生成中...
                </div>
              )}
              {currentStep === 'done' && (
                <div className="mt-2 text-xs text-green-600">
                  生成完成
                </div>
              )}
              {generatedTokens && !generating && currentStep === 'done' && (
                <div className="mt-2 max-h-40 overflow-y-auto rounded border border-green-100 bg-white px-3 py-2 text-xs text-gray-600">
                  {generatedTokens}
                </div>
              )}
            </StepCard>
          </div>
        </div>
      </div>
    </div>
  );
}
