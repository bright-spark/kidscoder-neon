import { createContext, useContext, useState } from 'react';
import type { PreviewContext } from '@/lib/types';

const PreviewContext = createContext<PreviewContext | undefined>(undefined);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [html, setHtml] = useState('');

  return (
    <PreviewContext.Provider value={{ html, setHtml }}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (context === undefined) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}