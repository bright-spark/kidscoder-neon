import { toast } from '@/components/ui/toast/use-toast'
import type { ToastOptions } from './types'
import type { ToastVariant } from './types'

function createToast(variant: ToastVariant, options: ToastOptions) {
  const { title, description, duration = 5000 } = options

  const variantClasses = {
    system: 'bg-purple-500 text-white rounded-lg shadow-lg border-none',
    error: 'bg-red-500 text-white rounded-lg shadow-lg border-none',
    success: 'bg-green-500 text-white rounded-lg shadow-lg border-none',
    progress: 'bg-orange-500 text-white rounded-lg shadow-lg border-none'
  }

  return toast({
    title,
    description,
    duration,
    className: variantClasses[variant]
  })
}

export const showToast = {
  system: (options: ToastOptions) => createToast('system', options),
  error: (options: ToastOptions) => createToast('error', options),
  success: (options: ToastOptions) => createToast('success', options),
  progress: (options: ToastOptions) => createToast('progress', options)
}

export { toast }
