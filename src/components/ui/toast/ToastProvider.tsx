import { ToastProvider as RadixToastProvider } from '@radix-ui/react-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <RadixToastProvider>{children}</RadixToastProvider>;
}