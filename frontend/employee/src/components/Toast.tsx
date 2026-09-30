import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, CircleX, Info, X } from "lucide-react";
export type ToastType = "success" | "error" | "warning" | "info";
export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}
export default function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || duration <= 0) return;
    const timer = window.setTimeout(() => onClose(id), duration);
    return () => window.clearTimeout(timer);
  }, [id, duration, paused, onClose]);
  const Icon = {
    success: CheckCircle2,
    error: CircleX,
    warning: AlertCircle,
    info: Info,
  }[type];
  return (
    <div
      className="toast"
      role={type === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
    >
      <span className="toast-icon">
        <Icon size={21} aria-hidden="true" />
      </span>
      <div className="toast-copy">
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="icon-button"
        aria-label="Close notification"
      >
        <X size={17} />
      </button>
    </div>
  );
}
