import { useState, useCallback } from 'react';

export interface Toast {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type?: Toast['type']) => {
    setToasts((prev) => [
      ...prev,
      { id: Date.now(), message, type }
    ]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
