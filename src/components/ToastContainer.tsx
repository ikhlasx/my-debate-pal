import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Toast } from '@/types/debate';

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const typeStyles = {
  info: 'bg-info text-white border-l-4 border-info',
  success: 'bg-success text-white border-l-4 border-success',
  warning: 'bg-warning text-white border-l-4 border-warning',
  error: 'bg-destructive text-white border-l-4 border-destructive',
};

export const ToastContainer = ({ toasts, onDismiss }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ 
              type: 'spring', 
              stiffness: 400, 
              damping: 25,
              mass: 0.8
            }}
            className={`
              ${typeStyles[toast.type]}
              rounded-xl shadow-elevated p-4 flex items-start gap-3
              backdrop-blur-sm bg-opacity-95
            `}
          >
            {toast.icon && (
              <span className="text-2xl flex-shrink-0">{toast.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm font-display">{toast.title}</p>
              <p className="text-sm opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
