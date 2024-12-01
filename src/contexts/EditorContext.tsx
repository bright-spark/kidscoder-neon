import { createContext, useContext, useState, useCallback } from 'react';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { useChat } from '@/contexts/ChatContext';
import { getCodeSuggestions } from '@/lib/ai-provider';
import type { EditorContext, Message } from '@/lib/types';

const EditorContext = createContext<EditorContext | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState('');
  const [language] = useState('html');
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { messages, addMessage } = useChat();

  const handleShare = useCallback(async () => {
    if (!code) return;

    try {
      const { data, error } = await supabase
        .from('code_snippets')
        .insert([{ code, language: 'html' }])
        .select('id')
        .single();

      if (error) throw error;

      const shareUrl = `${window.location.origin}/share/${data.id}`;
      await navigator.clipboard.writeText(shareUrl);

      const previewLink = document.createElement('a');
      previewLink.href = shareUrl;
      previewLink.target = '_blank';
      previewLink.click();

      showToast.success({
        title: 'Share link copied!',
        description: 'The link has been copied to your clipboard and opened in a new tab.',
      });
    } catch (error) {
      console.error('Error sharing code:', error);
      showToast.error({
        title: 'Share failed',
        description: 'Failed to generate share link. Please try again.',
      });
    }
  }, [code]);

  const handleDebug = useCallback(async () => {
    if (!code || isProcessing) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);

    try {
      const toastId = showToast.progress({
        title: 'Debugging code',
        description: 'Analyzing and fixing potential issues...',
        steps: [
          { label: 'Analyzing code', status: 'complete' },
          { label: 'Identifying issues', status: 'loading' },
          { label: 'Applying fixes', status: 'pending' }
        ],
        progress: 33,
        duration: 10000
      });
      
      const debugPrompt = "Debug this code, find potential issues, and fix them. Maintain the same functionality but make it more robust and error-free.";
      
      addMessage({ role: 'user', content: debugPrompt });
      const debuggedCode = await getCodeSuggestions(code, debugPrompt, messages, controller.signal);
      
      if (debuggedCode) {
        setCode(debuggedCode);
        addMessage({ role: 'assistant', content: debuggedCode });
        
        showToast.success({
          title: 'Code debugged',
          description: 'The code has been debugged and updated.',
        });
      }
    } catch (error: any) {
      console.error('Error debugging code:', error);
      showToast.error({
        title: 'Debug failed',
        description: error.message || 'Failed to debug code. Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  }, [code, isProcessing, messages, addMessage]);

  const handleImprove = useCallback(async () => {
    if (!code || isProcessing) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);

    try {
      const toastId = showToast.progress({
        title: 'Improving code',
        description: 'Analyzing and enhancing code quality...',
        steps: [
          { label: 'Analyzing structure', status: 'complete' },
          { label: 'Optimizing code', status: 'loading' },
          { label: 'Applying improvements', status: 'pending' }
        ],
        progress: 33,
        duration: 10000
      });
      
      const improvePrompt = "Improve this code by making it more efficient, maintainable, and adding better error handling. Keep the same functionality but enhance the code quality.";
      
      addMessage({ role: 'user', content: improvePrompt });
      const improvedCode = await getCodeSuggestions(code, improvePrompt, messages, controller.signal);
      
      if (improvedCode) {
        setCode(improvedCode);
        addMessage({ role: 'assistant', content: improvedCode });
        
        showToast.success({
          title: 'Code improved',
          description: 'The code has been improved and updated.',
        });
      }
    } catch (error: any) {
      console.error('Error improving code:', error);
      showToast.error({
        title: 'Improvement failed',
        description: error.message || 'Failed to improve code. Please try again.',
      });
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  }, [code, isProcessing]);

  const cancelOperation = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsProcessing(false);
    }
  }, [abortController]);

  return (
    <EditorContext.Provider 
      value={{ 
        code, 
        setCode, 
        language, 
        setLanguage: () => {},
        handleShare,
        handleDebug,
        handleImprove,
        isProcessing,
        cancelOperation
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}