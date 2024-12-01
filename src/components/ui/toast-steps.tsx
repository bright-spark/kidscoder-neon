import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ToastStep, ToastVariant } from '@/lib/types';
import { Progress } from '@/components/ui/progress';

const toastStepVariants = cva(
  'flex w-full items-center gap-2 rounded-lg p-4',
  {
    variants: {
      variant: {
        system: 'bg-background text-foreground',
        error: 'bg-destructive text-destructive-foreground',
        success: 'bg-green-500 text-white',
        progress: 'bg-background text-foreground',
      },
    },
    defaultVariants: {
      variant: 'system',
    },
  }
);

interface ToastStepsProps extends VariantProps<typeof toastStepVariants> {
  title: string;
  description?: string;
  steps?: ToastStep[];
  progress?: number;
  variant: ToastVariant;
}

export function ToastSteps({
  title,
  description,
  steps,
  progress,
  variant,
}: ToastStepsProps) {
  const Icon = React.useMemo(() => {
    switch (variant) {
      case 'error':
        return XCircle;
      case 'success':
        return CheckCircle2;
      case 'progress':
        return Loader2;
      default:
        return Info;
    }
  }, [variant]);

  return (
    <div className={cn(toastStepVariants({ variant }))}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        <Icon className={cn(
          'h-4 w-4',
          variant === 'progress' && 'animate-spin'
        )} />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-none tracking-tight">
            {title}
          </p>
        </div>
        
        {description && (
          <p className="text-sm opacity-90">{description}</p>
        )}
        
        {steps && (
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm"
              >
                {step.status === 'complete' && (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                )}
                {step.status === 'loading' && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {step.status === 'pending' && (
                  <div className="h-3 w-3 rounded-full border-2" />
                )}
                {step.status === 'error' && (
                  <XCircle className="h-3 w-3 text-destructive" />
                )}
                <span className="flex-1">{step.label}</span>
              </div>
            ))}
          </div>
        )}
        
        {typeof progress === 'number' && (
          <Progress value={progress} className="h-1" />
        )}
      </div>
    </div>
  );
}