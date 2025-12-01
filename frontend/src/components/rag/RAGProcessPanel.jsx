import { useState } from 'react';
import { useRagStore } from '../../stores/ragStore';
import StepCard from './StepCard';
import ChunkPreview from './ChunkPreview';

export default function RAGProcessPanel() {
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

  const getStepStatus = (step) => {
    const steps = ['embedding', 'retrieval', 'prompt', 'generating', 'done'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return currentStep === 'done' ? 'done' : 'processing';
    return 'pending';
  };

  return (
    <div className="w-80 min-w-[280px] bg-gray-50 border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          RAG 检索过程
        </h2>

        <div className="space-y-3">
          {/* Step 1: User Query */}
          <StepCard
            step={1}
            title="用户问题"
            status={query ? 'done' : 'pending'}
          >
            {query && (
              <div className="mt-2 p-2 bg-white rounded border text-sm text-gray-700">
                {query}
              </div>
            )}
          </StepCard>

          {/* Step 2: Embedding */}
          <StepCard
            step={2}
            title="Query 向量化"
            status={getStepStatus('embedding')}
          >
            {embeddingDone && (
              <div className="mt-2 text-xs text-gray-500">
                已完成 · 维度: {embeddingDimension}
              </div>
            )}
          </StepCard>

          {/* Step 3: Retrieval */}
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

          {/* Step 4: Prompt */}
          <StepCard
            step={4}
            title="Prompt 组装"
            status={getStepStatus('prompt')}
          >
            {prompt && (
              <div className="mt-2">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {showPrompt ? '收起' : '展开查看'}
                  <svg className={`w-3 h-3 transition-transform ${showPrompt ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showPrompt && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs text-gray-600 max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {prompt}
                  </div>
                )}
              </div>
            )}
          </StepCard>

          {/* Step 5: Generating */}
          <StepCard
            step={5}
            title="生成回答"
            status={getStepStatus('generating')}
          >
            {generating && (
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-600">
                <span className="animate-pulse">●</span>
                生成中...
              </div>
            )}
            {currentStep === 'done' && (
              <div className="mt-2 text-xs text-green-600">
                生成完成
              </div>
            )}
          </StepCard>
        </div>
      </div>
    </div>
  );
}
