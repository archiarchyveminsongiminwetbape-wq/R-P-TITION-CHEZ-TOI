import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { X } from "lucide-react"
import { cn } from "../lib/utils"

type ToastVariant = 'default' | 'destructive'

interface ToastActionElementProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  altText: string
  className?: string
  children: React.ReactNode
}

export const ToastActionElement = React.forwardRef<HTMLButtonElement, ToastActionElementProps>(
  ({ altText, className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      aria-label={altText}
      {...props}
    >
      {children}
    </button>
  )
)
ToastActionElement.displayName = "ToastActionElement"

const ToastProvider = ToastPrimitives.Provider

type ToastViewportElement = React.ElementRef<typeof ToastPrimitives.Viewport>
type ToastViewportProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>

const ToastViewport = React.forwardRef<ToastViewportElement, ToastViewportProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Viewport
      ref={ref}
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
        className
      )}
      {...props}
    />
  )
)
ToastViewport.displayName = "ToastViewport"

type ToastElement = React.ElementRef<typeof ToastPrimitives.Root>
type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
  variant?: ToastVariant
}

const Toast = React.forwardRef<ToastElement, ToastProps>(
  ({ className, variant = "default", ...props }, ref) => (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md p-6 pr-8 shadow-lg transition-all",
        variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-white text-gray-900 border border-gray-200',
        className
      )}
      {...props}
    />
  )
)
Toast.displayName = "Toast"

type ToastActionElementType = React.ElementRef<typeof ToastPrimitives.Action>
type ToastActionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>

const ToastAction = React.forwardRef<ToastActionElementType, ToastActionProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Action
      ref={ref}
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
)
ToastAction.displayName = "ToastAction"

type ToastCloseElement = React.ElementRef<typeof ToastPrimitives.Close>
type ToastCloseProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>

const ToastClose = React.forwardRef<ToastCloseElement, ToastCloseProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Close
      ref={ref}
      className={cn(
        "absolute right-2 top-2 rounded-md p-1 text-gray-500 opacity-0 transition-opacity hover:text-gray-900 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
        className
      )}
      toast-close=""
      {...props}
    >
      <X className="h-4 w-4" />
    </ToastPrimitives.Close>
  )
)
ToastClose.displayName = "ToastClose"

type ToastTitleElement = React.ElementRef<typeof ToastPrimitives.Title>
type ToastTitleProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>

const ToastTitle = React.forwardRef<ToastTitleElement, ToastTitleProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Title
      ref={ref}
      className={cn("text-sm font-semibold", className)}
      {...props}
    />
  )
)
ToastTitle.displayName = "ToastTitle"

type ToastDescriptionElement = React.ElementRef<typeof ToastPrimitives.Description>
type ToastDescriptionProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>

const ToastDescription = React.forwardRef<ToastDescriptionElement, ToastDescriptionProps>(
  ({ className, ...props }, ref) => (
    <ToastPrimitives.Description
      ref={ref}
      className={cn("text-sm opacity-90", className)}
      {...props}
    />
  )
)
ToastDescription.displayName = "ToastDescription"

export interface ToastType {
  id: string
  title: string
  description?: string
  action?: React.ReactElement<ToastActionElementProps>
  variant?: ToastVariant
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const actionTypes = {
  ADD_TOAST: 'ADD_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  DISMISS_TOAST: 'DISMISS_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes[keyof typeof actionTypes]

type Action =
  | {
      type: 'ADD_TOAST'
      toast: ToastType
    }
  | {
      type: 'UPDATE_TOAST'
      toast: Partial<ToastType> & { id: string }
    }
  | {
      type: 'DISMISS_TOAST'
      toastId?: string
    }
  | {
      type: 'REMOVE_TOAST'
      toastId?: string
    }

interface State {
  toasts: ToastType[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId: toastId,
    })
  }, 1000)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 3),
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToastType, 'id'>

function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToastType) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update: (props: ToastType) =>
      update({
        ...props,
        id,
      }),
  }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export type {
  ToastProps,
  ToastActionProps,
  ToastCloseElement,
  ToastCloseProps,
  ToastDescriptionElement,
  ToastDescriptionProps,
  ToastElement,
  ToastTitleElement,
  ToastTitleProps,
  ToastViewportElement,
  ToastViewportProps,
}

export {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  useToast,
  toast,
}