import { create } from 'zustand';
import type {
  UIState,
  ToastMessage,
  ToastOptions,
  ConfirmModalState,
  ConfirmDialogOptions,
  DocumentChunk
} from '../types';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ui-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

const DEFAULT_TOAST_DURATION = 4000;

const defaultConfirm: ConfirmModalState = {
  open: false,
  title: '',
  description: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false
};

const buildToastPayload = (toast: Omit<ToastMessage, 'id'> & { id?: string }): ToastMessage => ({
  id: toast.id || createId(),
  type: toast.type || 'info',
  title: toast.title,
  message: toast.message,
  duration: toast.duration ?? DEFAULT_TOAST_DURATION
});

let pendingConfirmResolver: ((value: boolean) => void) | null = null;
const resolvePendingConfirm = (result: boolean) => {
  if (pendingConfirmResolver) {
    const resolver = pendingConfirmResolver;
    pendingConfirmResolver = null;
    resolver(result);
  }
};

export const useUIStore = create<UIState>((set, get) => ({
  loading: { open: false, message: '' },
  toastQueue: [],
  confirm: defaultConfirm,
  chunkView: {
    open: false,
    chunks: [],
    activeIndex: 0
  },
  uploadProgress: {
    open: false,
    completed: false,
    result: null,
    documentName: null,
    currentStep: 0
  },

  setLoading: (open: boolean, message?: string) =>
    set({ loading: { open, message } }),

  showToast: (toast: Omit<ToastMessage, 'id'> & { id?: string }) => {
    const payload = buildToastPayload(toast);
    set(state => ({
      toastQueue: [...state.toastQueue.filter(item => item.id !== payload.id), payload]
    }));
    return payload.id;
  },

  hideToast: (id: string) =>
    set(state => ({
      toastQueue: state.toastQueue.filter(toast => toast.id !== id)
    })),

  pushToast: (toast: ToastOptions) => get().showToast(toast),
  removeToast: (id: string) => get().hideToast(id),

  openConfirm: (options: Omit<ConfirmModalState, 'open'>) =>
    set({
      confirm: {
        ...defaultConfirm,
        ...options,
        open: true
      }
    }),

  closeConfirm: () => {
    resolvePendingConfirm(false);
    set(state => ({
      confirm: {
        ...state.confirm,
        open: false
      }
    }));
  },

  showConfirm: (options: ConfirmDialogOptions) => {
    resolvePendingConfirm(false);
    return new Promise<boolean>((resolve) => {
      pendingConfirmResolver = resolve;
      get().openConfirm({
        title: options.title || defaultConfirm.title,
        description: options.message,
        confirmText: options.confirmText || defaultConfirm.confirmText,
        cancelText: options.cancelText || defaultConfirm.cancelText,
        danger: options.danger ?? defaultConfirm.danger,
        onConfirm: () => {
          resolvePendingConfirm(true);
        },
        onCancel: () => {
          resolvePendingConfirm(false);
        }
      });
    });
  },

  openChunkView: (chunks: DocumentChunk[], activeIndex = 0) =>
    set({
      chunkView: {
        open: true,
        chunks,
        activeIndex: Math.max(0, Math.min(activeIndex, Math.max(chunks.length - 1, 0)))
      }
    }),

  closeChunkView: () =>
    set(state => ({
      chunkView: {
        ...state.chunkView,
        open: false
      }
    })),

  setActiveChunk: (index: number) =>
    set(state => {
      const { chunks } = state.chunkView;
      const clampedIndex = Math.max(0, Math.min(index, Math.max(chunks.length - 1, 0)));
      return {
        chunkView: {
          ...state.chunkView,
          activeIndex: clampedIndex
        }
      };
    }),

  openUploadProgress: (documentName) =>
    set({
      uploadProgress: {
        open: true,
        completed: false,
        result: null,
        documentName: documentName ?? null,
        currentStep: 0
      }
    }),

  setUploadProgressStep: (step: number) =>
    set(state => ({
      uploadProgress: {
        ...state.uploadProgress,
        currentStep: Math.max(state.uploadProgress.currentStep, step)
      }
    })),

  completeUploadProgress: (result, documentName) =>
    set(state => ({
      uploadProgress: {
        open: true,
        completed: true,
        result,
        documentName: documentName ?? state.uploadProgress.documentName,
        currentStep: 4
      }
    })),

  closeUploadProgress: () =>
    set({
      uploadProgress: {
        open: false,
        completed: false,
        result: null,
        documentName: null,
        currentStep: 0
      }
    })
}));

