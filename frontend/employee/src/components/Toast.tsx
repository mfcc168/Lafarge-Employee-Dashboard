import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

/**
 * Toast Component
 * 
 * Modern notification toast with:
 * - Multiple types (success, error, warning, info)
 * - Auto-dismiss functionality
 * - Smooth animations
 * - Design system integration
 * - Manual close option
 */
const Toast = ({ id, type, title, message, duration = 5000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Show animation
    setIsVisible(true);

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 50);

    // Auto dismiss
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={20} />,
          bgColor: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
          iconBg: 'bg-white/20 backdrop-blur-sm',
          iconColor: 'text-white',
          titleColor: 'text-white',
          messageColor: 'text-emerald-100',
          progressColor: 'bg-white/30'
        };
      case 'error':
        return {
          icon: <XCircle size={20} />,
          bgColor: 'bg-gradient-to-r from-slate-700 to-error-600',
          iconBg: 'bg-white/20 backdrop-blur-sm',
          iconColor: 'text-white',
          titleColor: 'text-white',
          messageColor: 'text-error-100',
          progressColor: 'bg-white/30'
        };
      case 'warning':
        return {
          icon: <AlertCircle size={20} />,
          bgColor: 'bg-gradient-to-r from-slate-700 to-warning-600',
          iconBg: 'bg-white/20 backdrop-blur-sm',
          iconColor: 'text-white',
          titleColor: 'text-white',
          messageColor: 'text-warning-100',
          progressColor: 'bg-white/30'
        };
      case 'info':
        return {
          icon: <Info size={20} />,
          bgColor: 'bg-gradient-to-r from-slate-700 to-emerald-600',
          iconBg: 'bg-white/20 backdrop-blur-sm',
          iconColor: 'text-white',
          titleColor: 'text-white',
          messageColor: 'text-slate-100',
          progressColor: 'bg-white/30'
        };
      default:
        return {
          icon: <Info size={20} />,
          bgColor: 'bg-gradient-to-r from-slate-700 to-slate-600',
          iconBg: 'bg-white/20 backdrop-blur-sm',
          iconColor: 'text-white',
          titleColor: 'text-white',
          messageColor: 'text-slate-100',
          progressColor: 'bg-white/30'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        max-w-md w-full ${styles.bgColor} rounded-2xl shadow-soft hover:shadow-strong p-6 text-white
        transform transition-all duration-300 ease-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        animate-slideInRight
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div className={`flex-shrink-0 w-10 h-10 ${styles.iconBg} rounded-xl flex items-center justify-center ${styles.iconColor}`}>
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`text-base font-bold ${styles.titleColor} font-display mb-1`}>
            {title}
          </h4>
          {message && (
            <p className={`text-sm ${styles.messageColor} leading-relaxed`}>
              {message}
            </p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all duration-fast text-white hover:scale-110`}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4 h-1 bg-white/20 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-75 ease-linear ${styles.progressColor}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default Toast;