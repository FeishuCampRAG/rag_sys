import { useCallback } from 'react';
import type { ToastOptions } from '../types';
import { useUIStore } from '../stores/uiStore';

export function useToast() {
  const pushToast = useUIStore(state => state.pushToast);

  return useCallback(
    (options: ToastOptions) => pushToast(options),
    [pushToast]
  );
}
