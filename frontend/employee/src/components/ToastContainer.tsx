import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import Toast, { type ToastProps } from "./Toast";
export interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}
export default function ToastContainer({
  toasts,
  onClose,
}: ToastContainerProps) {
  const { pathname } = useLocation();
  const isReport = pathname === "/report" || pathname === "/report/";
  if (!toasts.length) return null;
  return createPortal(
    <div
      className={`toast-container ${isReport ? "report-notifications" : ""}`}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>,
    document.body,
  );
}
