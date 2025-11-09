import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Toast = {
  id: number
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error'
  duration?: number
}

type ToastContextType = {
  toasts: Toast[]
  toast: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), [])
  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    const item: Toast = { id, variant: 'default', duration: 3500, ...t }
    setToasts((ts) => [...ts, item])
    if (item.duration && item.duration > 0) setTimeout(() => dismiss(id), item.duration)
  }, [dismiss])
  const value = useMemo(() => ({ toasts, toast, dismiss }), [toasts, toast, dismiss])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`min-w-[280px] max-w-sm rounded border p-3 shadow bg-white ${t.variant === 'success' ? 'border-green-500' : t.variant === 'error' ? 'border-red-500' : 'border-slate-300'}`}>
            {t.title && <div className="font-semibold mb-1">{t.title}</div>}
            {t.description && <div className="text-sm opacity-80">{t.description}</div>}
            <button className="text-xs mt-2 underline" onClick={() => dismiss(t.id)}>Fermer</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
