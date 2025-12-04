import { create } from 'zustand';
import { DocumentState } from '../types';
import { api } from '../services/api';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  uploading: false,
  selectedDocId: null,
  selectedDocContent: null,
  selectedDocLoading: false,
  selectedDocError: null,

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
        set({ selectedDocId: null, selectedDocContent: null, selectedDocLoading: false, selectedDocError: null });
      }
    }
    return result;
  },

  selectDocument: async (id: string | null) => {
    if (!id) {
      set({ selectedDocId: null, selectedDocContent: null, selectedDocLoading: false, selectedDocError: null });
      return;
    }

    set({ selectedDocId: id, selectedDocContent: null, selectedDocLoading: true, selectedDocError: null });

    try {
      const result = await api.getDocumentContent(id);
      if (result.success && result.data && typeof result.data.content === 'string') {
        set({ selectedDocContent: result.data.content, selectedDocLoading: false });
      } else {
        set({
          selectedDocContent: null,
          selectedDocLoading: false,
          selectedDocError: result.error || '文档内容加载失败'
        });
      }
    } catch (error) {
      set({
        selectedDocContent: null,
        selectedDocLoading: false,
        selectedDocError: error instanceof Error ? error.message : '文档内容加载失败'
      });
    }
  }
}));
