import type { ToastOptions, ToastVariant, ToastStep } from './types';

export function getStepStatus(currentStep: number, totalSteps: number): ToastStep['status'][] {
  return Array(totalSteps).fill('pending').map((_, index) => {
    if (index < currentStep) return 'complete';
    if (index === currentStep) return 'loading';
    return 'pending';
  });
}

export function calculateProgress(currentStep: number, totalSteps: number): number {
  return Math.round((currentStep / totalSteps) * 100);
}

export const DEFAULT_TOAST_DURATION = 5000;

export function getToastClassNames(variant: ToastVariant): string {
  const baseClasses = 'toast-animation';
  
  switch (variant) {
    case 'system':
      return `${baseClasses} system-toast`;
    case 'error':
      return `${baseClasses} error-toast`;
    case 'success':
      return `${baseClasses} success-toast`;
    case 'progress':
      return `${baseClasses} progress-toast`;
    default:
      return baseClasses;
  }
}