import { createPortal } from "react-dom";
import Toast, { type ToastProps } from "./Toast";
export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}
export default function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps) {
  if (!toasts.length) return null;
  return createPortal(
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );
}
