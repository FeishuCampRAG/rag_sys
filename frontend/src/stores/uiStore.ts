import { create } from 'zustand';
import type {
  UIState,
  ToastMessage,
  ToastOptions,
  ConfirmDialogOptions,
  ConfirmDialogState
} from '../types';

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `ui-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
};

let confirmResolver: ((result: boolean) => void) | null = null;

const withDefaults = (options: ConfirmDialogOptions): ConfirmDialogState => ({
  id: createId(),
  title: options.title || '操作确认',
  message: options.message,
  confirmText: options.confirmText || '确定',
  cancelText: options.cancelText || '取消',
  danger: options.danger ?? false
});

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  confirmDialog: null,
  globalLoading: false,

  pushToast: (toast: ToastOptions) => {
    const next: ToastMessage = {
      id: createId(),
      type: toast.type || 'info',
      title: toast.title,
      message: toast.message,
      duration: toast.duration ?? 2600
    };
    set(state => ({ toasts: [...state.toasts, next] }));
    return next.id;
  },

  removeToast: (id: string) => {
    set(state => ({ toasts: state.toasts.filter(toast => toast.id !== id) }));
  },

  showConfirm: (options: ConfirmDialogOptions) => {
    if (confirmResolver) {
      confirmResolver(false);
    }
    return new Promise<boolean>((resolve) => {
      confirmResolver = resolve;
      set({ confirmDialog: withDefaults(options) });
    });
  },

  resolveConfirm: (result: boolean) => {
    const resolver = confirmResolver;
    confirmResolver = null;
    set({ confirmDialog: null });
    resolver?.(result);
  },

  setGlobalLoading: (loading: boolean) => set({ globalLoading: loading })
}));
