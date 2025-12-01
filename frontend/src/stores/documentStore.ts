import { create } from 'zustand';
import { DocumentState, Document, DocumentChunk } from '../types';
import { api } from '../services/api';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  uploading: false,
  selectedDocId: null,
  selectedDocChunks: [],

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
    set({ selectedDocId: id });
    if (id) {
      const result = await api.getDocumentChunks(id);
      if (result.success && result.data) {
        set({ selectedDocChunks: result.data });
      }
    } else {
      set({ selectedDocChunks: [] });
    }
  }
}));