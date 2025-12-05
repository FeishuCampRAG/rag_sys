import { create } from 'zustand';
import { DocumentState } from '../types';
import { api } from '../services/api';
import { useUIStore } from './uiStore';

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  uploading: false,
  selectedDocId: null,
  selectedDocChunks: [],
  chunksLoading: false,
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
    const ui = useUIStore.getState();
    ui.openUploadProgress(file.name);
    ui.setUploadProgressStep(0);
    set({ uploading: true });
    try {
      const result = await api.uploadDocument(file);
      if (result.success && result.data) {
        ui.setUploadProgressStep(1);
        await get().fetchDocuments();
        await get().pollDocumentStatus(result.data.id);
      } else {
        ui.completeUploadProgress('error', file.name);
      }
      return result;
    } catch (error) {
      ui.completeUploadProgress('error', file.name);
      throw error;
    } finally {
      set({ uploading: false });
    }
  },

  pollDocumentStatus: async (docId: string) => {
    return new Promise<void>((resolve) => {
      let finished = false;

      const done = () => {
        if (finished) return;
        finished = true;
        resolve();
      };

      const iterate = async () => {
        if (finished) return;
        try {
          const result = await api.getDocument(docId);
          if (result.success && result.data) {
            const doc = result.data;
            if (doc.status === 'ready' || doc.status === 'error') {
              await get().fetchDocuments();
              const ui = useUIStore.getState();
              ui.completeUploadProgress(doc.status === 'ready' ? 'success' : 'error', doc.original_name);
              done();
              return;
            }
            useUIStore.getState().setUploadProgressStep(2);
          }
        } catch {
          useUIStore.getState().completeUploadProgress('error');
          done();
          return;
        }
        setTimeout(iterate, 800);
      };

      useUIStore.getState().setUploadProgressStep(2);
      void iterate();
    });
  },

  deleteDocument: async (id: string) => {
    const result = await api.deleteDocument(id);
    if (result.success) {
      await get().fetchDocuments();
      if (get().selectedDocId === id) {
        set({
          selectedDocId: null,
          selectedDocChunks: [],
          chunksLoading: false,
          selectedDocContent: null,
          selectedDocLoading: false,
          selectedDocError: null
        });
      }
    }
    return result;
  },

  selectDocument: async (id: string | null) => {
    const notify = useUIStore.getState().pushToast;

    if (!id) {
      set({
        selectedDocId: null,
        selectedDocChunks: [],
        chunksLoading: false,
        selectedDocContent: null,
        selectedDocLoading: false,
        selectedDocError: null
      });
      return;
    }

    set({
      selectedDocId: id,
      selectedDocChunks: [],
      chunksLoading: true,
      selectedDocContent: null,
      selectedDocLoading: true,
      selectedDocError: null
    });

    const loadChunks = async () => {
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
    };

    const loadContent = async () => {
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
    };

    await Promise.all([loadChunks(), loadContent()]);
  }
}));
