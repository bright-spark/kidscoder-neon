import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[4px] text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden min-w-[90px] w-full md:w-[120px]",
  {
    variants: {
      intent: {
        primary: "bg-blue-100 dark:bg-blue-900/80 text-blue-900 dark:text-blue-100 shadow-[0_0_25px_rgba(59,130,246,0.9)] hover:shadow-[0_0_35px_rgba(59,130,246,1)] hover:bg-blue-200 dark:hover:bg-blue-800/90 border-2 border-blue-500/80 after:ring-blue-500 after:ring-offset-background",
        secondary: "bg-secondary text-secondary-foreground shadow-[0_0_12px_rgba(139,92,246,0.3)] hover:shadow-[0_0_18px_rgba(139,92,246,0.5)] hover:bg-secondary/80",
        success: "bg-orange-500/90 text-white border-2 border-orange-300 shadow-[0_0_25px_rgba(249,115,22,0.9)] hover:shadow-[0_0_35px_rgba(249,115,22,1)] hover:bg-orange-600/90 after:ring-orange-400 after:ring-offset-background",
        debug: "bg-red-50 dark:bg-red-900/60 text-red-900 dark:text-red-100 shadow-[0_0_25px_rgba(239,68,68,0.9)] hover:shadow-[0_0_35px_rgba(239,68,68,1)] hover:bg-red-100 dark:hover:bg-red-800/70 border-2 border-red-500/80 after:ring-red-500 after:ring-offset-background",
        improve: "bg-emerald-50 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 shadow-[0_0_25px_rgba(16,185,129,0.9)] hover:shadow-[0_0_35px_rgba(16,185,129,1)] hover:bg-emerald-100 dark:hover:bg-emerald-800/70 border-2 border-emerald-500/80 after:ring-emerald-500 after:ring-offset-background",
        preview: "bg-purple-100 dark:bg-purple-900/80 text-purple-900 dark:text-purple-100 shadow-[0_0_25px_rgba(147,51,234,0.9)] hover:shadow-[0_0_35px_rgba(147,51,234,1)] hover:bg-purple-200 dark:hover:bg-purple-800/90 border-2 border-purple-500/80 after:ring-purple-500 after:ring-offset-background",
        danger: "bg-destructive text-destructive-foreground shadow-[0_0_12px_rgba(239,68,68,0.5)] hover:shadow-[0_0_18px_rgba(239,68,68,0.7)] hover:bg-destructive/90",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      state: {
        active: "after:absolute after:inset-[1.5px] after:rounded-[3px] after:ring-[2px] after:ring-offset-1",
        inactive: "",
        loading: "cursor-wait opacity-70",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 px-2 text-xs",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      intent: "primary",
      state: "inactive",
      size: "default"
    },
  }
);

export type ButtonIntent = "primary" | "secondary" | "preview" | "danger" | "debug" | "improve" | "ghost" | "link";
export type ButtonState = "active" | "inactive" | "loading";

export interface ButtonStyleProps {
  intent?: ButtonIntent;
  state?: ButtonState;
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function getButtonStyles({ intent, state, size, className }: ButtonStyleProps) {
  return cn(buttonVariants({ intent, state, size }), className);
}