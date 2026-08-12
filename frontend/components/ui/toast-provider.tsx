"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Alert, AlertTitle } from "@/components/ui/alert";

type ToastType = "success" | "error" | "critical";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(
  () => {}
);

export function useToast() {
  return useContext(ToastContext);
}

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const colorMap: Record<ToastType, string> = {
    success: "border-green-500 bg-green-950/80 text-green-300",
    error: "border-yellow-500 bg-yellow-950/80 text-yellow-300",
    critical: "border-red-500 bg-red-950/80 text-red-300",
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <Alert key={t.id} className={`animate-in slide-in-from-left fade-in duration-200 ${colorMap[t.type]}`}>
            <AlertTitle>{t.message}</AlertTitle>
          </Alert>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
