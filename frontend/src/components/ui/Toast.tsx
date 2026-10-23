'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => {
          const typeConfig = {
            success: {
              bg: 'bg-success-subtle',
              border: 'border-success-border',
              text: 'text-success',
              icon: CheckCircle,
            },
            error: {
              bg: 'bg-danger-subtle',
              border: 'border-danger-border',
              text: 'text-danger',
              icon: AlertCircle,
            },
            info: {
              bg: 'bg-primary-subtle',
              border: 'border-primary-border',
              text: 'text-primary',
              icon: CheckCircle,
            },
          };

          const config = typeConfig[t.type];
          const Icon = config.icon;

          return (
            <div
              key={t.id}
              className={`flex items-start justify-between gap-3 p-4 rounded-xl border ${config.bg} ${config.border} shadow-raised animate-slideInRight`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className={`w-5 h-5 shrink-0 ${config.text}`} />
                <span className="text-xs font-semibold text-ink-body font-body leading-relaxed">
                  {t.message}
                </span>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted hover:text-ink shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
