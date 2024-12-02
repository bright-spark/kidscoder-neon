import { createContext, useContext, useState, useCallback } from 'react';
import { showToast } from '@/lib/toast';
import { supabase } from '@/lib/supabase';
import { useChat } from '@/contexts/ChatContext';
import { getCodeSuggestions } from '@/lib/ai-provider';
import type { EditorContext, Message } from '@/lib/types';
import { useSession } from '@/contexts/SessionContext';

const EditorContext = createContext<EditorContext | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('html');
  const [isProcessing, setIsProcessing] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<'prompt'>('prompt');
  const { addMessage } = useChat();
  const { messages, updateTotalCharacters } = useSession();

  const handleClear = useCallback(() => {
    setCode('');
    setPromptCount(0);
  }, []);

  const handleGenerate = useCallback(async (prompt: string) => {
    if (isProcessing) return;

    const controller = new AbortController();
    setPromptCount(prev => prev + 1);
    setIsProcessing(true);
    setCurrentOperation('prompt');

    try {
      const userMessage: Message = {
        role: 'user',
        content: prompt
      };
      
      const response = await getCodeSuggestions(
        [...messages, userMessage],
        controller.signal
      );
      
      if (response) {
        setCode(response);
        if (addMessage) {
          addMessage({ role: 'assistant', content: response });
        }

        const totalChars = response.length;
        updateTotalCharacters(totalChars);
        showToast.success({
          title: '✨ Code Generated Successfully',
          description: `Your code is ready with ${totalChars.toLocaleString()} characters. Check it out in the editor!`,
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('Error generating code:', error);
      showToast.error({
        title: '❌ Generation Failed',
        description: error.message || 'Something went wrong while generating your code. Please try again or modify your prompt.',
        duration: 4000
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, addMessage, messages]);

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
        title: '🔗 Share Link Ready!',
        description: 'Link copied to clipboard and opened in a new tab for preview. Share it with others!',
        duration: 4000
      });
    } catch (error) {
      console.error('Error sharing code:', error);
      showToast.error({
        title: '❌ Share Failed',
        description: 'Unable to create share link. Please check your connection and try again.',
        duration: 4000
      });
    }
  }, [code]);

  const cancelOperation = useCallback(() => {
    setIsProcessing(false);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        code,
        setCode,
        isProcessing,
        promptCount,
        currentOperation,
        handleClear,
        handleGenerate,
        handleShare,
        cancelOperation,
        language,
        setLanguage,
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