import { create } from 'zustand';
import { RAGState, DocumentChunk } from '../types';

export const useRagStore = create<RAGState>((set) => ({
  currentStep: null,
  query: '',
  embeddingDone: false,
  embeddingDimension: 0,
  retrievedChunks: [],
  prompt: '',
  generating: false,
  generatedTokens: '',

  reset: () => set({
    currentStep: null,
    query: '',
    embeddingDone: false,
    embeddingDimension: 0,
    retrievedChunks: [],
    prompt: '',
    generating: false,
    generatedTokens: ''
  }),

  setQuery: (query: string) => set({ query }),

  updateStep: (event: string, data: any) => {
    if (event === 'step') {
      switch (data.step) {
        case 'embedding':
          if (data.status === 'done') {
            set({
              currentStep: 'embedding',
              embeddingDone: true,
              embeddingDimension: data.dimension
            });
          } else {
            set({ currentStep: 'embedding', embeddingDone: false });
          }
          break;
        case 'retrieval':
          if (data.status === 'done') {
            set({
              currentStep: 'retrieval',
              retrievedChunks: data.chunks || []
            });
          } else {
            set({ currentStep: 'retrieval' });
          }
          break;
        case 'prompt':
          if (data.status === 'done') {
            set({
              currentStep: 'prompt',
              prompt: data.content || ''
            });
          } else {
            set({ currentStep: 'prompt' });
          }
          break;
        case 'generating':
          set({ currentStep: 'generating', generating: true });
          break;
      }
    } else if (event === 'token') {
      set(state => ({
        generatedTokens: state.generatedTokens + data.token
      }));
    } else if (event === 'done') {
      set({ currentStep: 'done', generating: false });
    } else if (event === 'error') {
      set({ currentStep: 'error', generating: false });
    }
  }
}));