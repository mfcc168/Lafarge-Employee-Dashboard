import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ToastProps, ToastType } from '@components/Toast';
import ToastContainer from '@components/ToastContainer';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * ToastProvider Component
 * 
 * Provides toast functionality throughout the app with:
 * - Multiple toast types with convenience methods
 * - Automatic ID generation
 * - Toast management (show, hide, clear all)
 * - Built-in container rendering
 */
export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const showToast = useCallback((
    type: ToastType, 
    title: string, 
    message?: string, 
    duration = 5000
  ) => {
    const id = generateId();
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onClose: hideToast
    };

    setToasts(prev => [...prev, newToast]);
  }, [generateId]);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showToast('success', title, message, duration);
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showToast('error', title, message, duration);
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showToast('warning', title, message, duration);
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showToast('info', title, message, duration);
  }, [showToast]);

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    hideAllToasts
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

/**
 * useToast Hook
 * 
 * Provides access to toast functionality with error handling
 * 
 * @returns Toast context methods
 * @throws Error if used outside ToastProvider
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default ToastContext;