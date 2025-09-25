import { createPortal } from 'react-dom';
import Toast, { ToastProps } from './Toast';

export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

/**
 * ToastContainer Component
 * 
 * Renders toasts in a fixed position container with:
 * - Portal rendering for proper z-index
 * - Stacked layout for multiple toasts
 * - Responsive positioning
 * - Smooth animations
 */
const ToastContainer = ({ toasts, onClose }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  const toastContainer = (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
      {toasts.map((toast, index) => (
        <div 
          key={toast.id} 
          className="pointer-events-auto"
          style={{
            animationDelay: `${index * 100}ms`
          }}
        >
          <Toast {...toast} onClose={onClose} />
        </div>
      ))}
    </div>
  );

  // Render in portal to ensure proper z-index layering
  return createPortal(toastContainer, document.body);
};

export default ToastContainer;