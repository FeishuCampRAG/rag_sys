import { create } from 'zustand';
import { DocumentState, Document, DocumentChunk } from '../types';
import { api } from '../services/api';
import { useUIStore } from './uiStore';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  uploading: false,
  selectedDocId: null,
  selectedDocChunks: [],
  chunksLoading: false,

  fetchDocuments: async () => {
    const result = await api.getDocuments();
    if (result.success && result.data) {
      set({ documents: result.data });
    }
  },

  uploadDocument: async (file: File) => {
    set({ uploading: true });
    try {
      const result = await api.uploadDocument(file);
      if (result.success && result.data) {
        // Refresh document list
        await get().fetchDocuments();
        // Poll for status update
        get().pollDocumentStatus(result.data.id);
      }
      return result;
    } finally {
      set({ uploading: false });
    }
  },

  pollDocumentStatus: async (docId: string) => {
    const poll = async () => {
      const result = await api.getDocument(docId);
      if (result.success && result.data) {
        const doc = result.data;
        if (doc.status === 'ready' || doc.status === 'error') {
          await get().fetchDocuments();
          return;
        }
        setTimeout(poll, 1000);
      }
    };
    poll();
  },

  deleteDocument: async (id: string) => {
    const result = await api.deleteDocument(id);
    if (result.success) {
      await get().fetchDocuments();
      if (get().selectedDocId === id) {
        set({ selectedDocId: null, selectedDocChunks: [] });
      }
    }
    return result;
  },

  selectDocument: async (id: string | null) => {
    const notify = useUIStore.getState().pushToast;
    if (!id) {
      set({ selectedDocId: null, selectedDocChunks: [], chunksLoading: false });
      return;
    }

    set({ selectedDocId: id, selectedDocChunks: [], chunksLoading: true });
    try {
      const result = await api.getDocumentChunks(id);
      if (result.success && result.data) {
        set({ selectedDocChunks: result.data, chunksLoading: false });
        return;
      }
      set({ selectedDocChunks: [], chunksLoading: false });
      notify({
        type: 'error',
        title: '拉取片段失败',
        message: result.error || '未能获取文档片段，请稍后再试'
      });
    } catch (error) {
      set({ selectedDocChunks: [], chunksLoading: false });
      const message = error instanceof Error ? error.message : '未能获取文档片段，请稍后再试';
      notify({
        type: 'error',
        title: '拉取片段失败',
        message
      });
    }
  }
}));
