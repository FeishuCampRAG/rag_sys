import { useCallback } from 'react';
import type { ConfirmDialogOptions } from '../types';
import { useUIStore } from '../stores/uiStore';

export function useConfirm() {
  const showConfirm = useUIStore(state => state.showConfirm);

  return useCallback(
    (options: ConfirmDialogOptions) => showConfirm(options),
    [showConfirm]
  );
}
