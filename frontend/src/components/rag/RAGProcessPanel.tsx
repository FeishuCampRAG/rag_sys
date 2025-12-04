import type { CSSProperties } from 'react';
import { useRagStore } from '../../stores/ragStore';
import { useUIStore } from '../../stores/uiStore';
import type { RAGWorkStep, StepStatus } from '../../types';
import QueryStep from './QueryStep';
import EmbeddingStep from './EmbeddingStep';
import RetrievalStep from './RetrievalStep';
import PromptStep from './PromptStep';
import GeneratingStep from './GeneratingStep';

interface RAGProcessPanelProps {
  className?: string;
  style?: CSSProperties;
}

const workSteps: RAGWorkStep[] = ['embedding', 'retrieval', 'prompt', 'generating'];

const stepOrderIndex = (step: RAGWorkStep) => workSteps.indexOf(step);

export default function RAGProcessPanel({ className = '', style }: RAGProcessPanelProps) {
  const {
    query,
    currentStep,
    failedStep,
    embeddingDone,
    embeddingDimension,
    retrievedChunks,
    prompt,
    generating,
    generatedTokens,
    errorMessage
  } = useRagStore();
  const openChunkView = useUIStore(state => state.openChunkView);

  const getErrorMessageForStep = (step: RAGWorkStep): string | null => {
    if (currentStep !== 'error') return null;
    if (!failedStep) return step === 'generating' ? (errorMessage ?? null) : null;
    return failedStep === step ? (errorMessage ?? null) : null;
  };

  const getEmbeddingStatus = (): StepStatus => {
    if (currentStep === 'error' && failedStep === 'embedding') return 'error';
    if (embeddingDone) return 'done';
    if (currentStep === 'embedding') return 'processing';
    return query ? 'pending' : 'pending';
  };

  const getRetrievalStatus = (): StepStatus => {
    if (currentStep === 'error' && failedStep === 'retrieval') return 'error';
    if (retrievedChunks.length > 0) return 'done';
    if (currentStep === 'retrieval') return 'processing';
    return embeddingDone ? 'pending' : 'pending';
  };

  const getPromptStatus = (): StepStatus => {
    if (currentStep === 'error' && failedStep === 'prompt') return 'error';
    if (prompt.trim().length > 0) return 'done';
    if (currentStep === 'prompt') return 'processing';
    return retrievedChunks.length > 0 ? 'pending' : 'pending';
  };

  const getGeneratingStatus = (): StepStatus => {
    if (currentStep === 'done') return 'done';
    if (currentStep === 'error') {
      if (!failedStep || failedStep === 'generating') {
        return 'error';
      }
      const failedIndex = stepOrderIndex(failedStep);
      const generatingIndex = stepOrderIndex('generating');
      return failedIndex < generatingIndex ? 'pending' : 'error';
    }
    if (generating || currentStep === 'generating') return 'processing';
    return prompt.trim().length > 0 ? 'pending' : 'pending';
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
            <QueryStep query={query} />

            <EmbeddingStep
              status={getEmbeddingStatus()}
              embeddingDone={embeddingDone}
              dimension={embeddingDimension}
              errorMessage={getErrorMessageForStep('embedding')}
            />

            <RetrievalStep
              status={getRetrievalStatus()}
              chunks={retrievedChunks}
              errorMessage={getErrorMessageForStep('retrieval')}
              onSelectChunk={retrievedChunks.length ? (index) => openChunkView(retrievedChunks, index) : undefined}
              onViewAllChunks={retrievedChunks.length ? () => openChunkView(retrievedChunks) : undefined}
            />

            <PromptStep
              status={getPromptStatus()}
              prompt={prompt}
              errorMessage={getErrorMessageForStep('prompt')}
            />

            <GeneratingStep
              status={getGeneratingStatus()}
              generating={generating}
              tokens={generatedTokens}
              errorMessage={getErrorMessageForStep('generating') ?? errorMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
