import { create } from 'zustand';
import type { RAGState, RAGProcessStep, RAGWorkStep } from '../types';

export const useRagStore = create<RAGState>((set) => ({
  currentStep: null,
  failedStep: null,
  query: '',
  embeddingDone: false,
  embeddingDimension: 0,
  retrievedChunks: [],
  prompt: '',
  generating: false,
  generatedTokens: '',
  errorMessage: null,

  reset: () => set({
    currentStep: null,
    failedStep: null,
    query: '',
    embeddingDone: false,
    embeddingDimension: 0,
    retrievedChunks: [],
    prompt: '',
    generating: false,
    generatedTokens: '',
    errorMessage: null
  }),

  setQuery: (query: string) => set({ query }),

  updateStep: (event: string, data: any) => {
    if (event === 'step') {
      const step = data.step as RAGProcessStep | undefined;
      if (!step) {
        return;
      }

      switch (step) {
        case 'embedding':
          set((state) => ({
            currentStep: 'embedding',
            failedStep: null,
            errorMessage: null,
            embeddingDone: data.status === 'done',
            embeddingDimension: data.status === 'done' && typeof data.dimension === 'number'
              ? data.dimension
              : data.status === 'done'
                ? state.embeddingDimension
                : 0
          }));
          break;
        case 'retrieval':
          set({
            currentStep: 'retrieval',
            failedStep: null,
            errorMessage: null,
            retrievedChunks: data.status === 'done' ? (data.chunks || []) : []
          });
          break;
        case 'prompt':
          set({
            currentStep: 'prompt',
            failedStep: null,
            errorMessage: null,
            prompt: data.status === 'done' ? (data.content || '') : ''
          });
          break;
        case 'generating':
          set((state) => ({
            currentStep: 'generating',
            failedStep: null,
            errorMessage: null,
            generating: true,
            generatedTokens: data.status === 'start' ? '' : state.generatedTokens
          }));
          break;
        case 'done':
          set({
            currentStep: 'done',
            failedStep: null,
            errorMessage: null,
            generating: false
          });
          break;
        case 'error':
          set((state) => ({
            currentStep: 'error',
            failedStep: state.currentStep && state.currentStep !== 'done' && state.currentStep !== 'error'
              ? state.currentStep as RAGWorkStep
              : state.failedStep,
            generating: false,
            errorMessage: data?.error || data?.message || '生成失败，请稍后重试。'
          }));
          break;
      }
    } else if (event === 'token') {
      set(state => ({
        generatedTokens: state.generatedTokens + (data?.token ?? '')
      }));
    } else if (event === 'done') {
      set({
        currentStep: 'done',
        failedStep: null,
        generating: false,
        errorMessage: null
      });
    } else if (event === 'error') {
      set((state) => ({
        currentStep: 'error',
        generating: false,
        failedStep: state.currentStep && state.currentStep !== 'done' && state.currentStep !== 'error'
          ? state.currentStep as RAGWorkStep
          : state.failedStep,
        errorMessage: data?.error || data?.message || '生成失败，请稍后重试。'
      }));
    }
  }
}));
