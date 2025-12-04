import { create } from 'zustand';
import type { UIState, ToastMessage, ConfirmModalState } from '../types';

const createId = () => `ui-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const defaultConfirm: ConfirmModalState = {
  open: false,
  title: '',
  description: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false
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

  setLoading: (open: boolean, message?: string) =>
    set({ loading: { open, message } }),

  showToast: (toast: Omit<ToastMessage, 'id'> & { id?: string }) => {
    const id = toast.id || createId();
    const payload: ToastMessage = {
      id,
      type: toast.type || 'info',
      message: toast.message,
      title: toast.title,
      duration: toast.duration ?? 3200
    };
    set(state => ({
      toastQueue: [...state.toastQueue.filter(item => item.id !== id), payload]
    }));
    return id;
  },

  hideToast: (id: string) =>
    set(state => ({ toastQueue: state.toastQueue.filter(toast => toast.id !== id) })),

  openConfirm: (options: Omit<ConfirmModalState, 'open'>) =>
    set({
      confirm: {
        ...defaultConfirm,
        ...options,
        open: true
      }
    }),

  closeConfirm: () =>
    set(state => ({
      confirm: {
        ...state.confirm,
        open: false
      }
    })),

  openChunkView: (chunks, activeIndex = 0) =>
    set({
      chunkView: {
        open: true,
        chunks,
        activeIndex: Math.max(0, Math.min(activeIndex, chunks.length - 1))
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
      const { chunkView } = state;
      const clampedIndex = Math.max(0, Math.min(index, chunkView.chunks.length - 1));
      return {
        chunkView: {
          ...chunkView,
          activeIndex: clampedIndex
        }
      };
    })
}));
