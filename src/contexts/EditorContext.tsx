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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [promptCount, setPromptCount] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<'debug' | 'improve' | 'prompt'>('prompt');
  const { messages, addMessage, updateTotalCharacters } = useChat();

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
      const response = await getCodeSuggestions([
        { role: 'user', content: prompt }
      ], controller.signal);
      
      if (response) {
        setCode(response);
        if (addMessage) {
          addMessage({ role: 'assistant', content: response });
        }

        const totalChars = response.length;
        showToast.info({
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
  }, [isProcessing, addMessage]);

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

  const handleDebug = useCallback(async () => {
    if (isProcessing || !code) return;

    const controller = new AbortController();
    setPromptCount(prev => prev + 1);
    setIsProcessing(true);
    setIsDebugging(true);
    setCurrentOperation('debug');

    try {
      const response = await getCodeSuggestions([
        ...messages,
        { role: 'user', content: 'Debug this code and explain any issues found:\n\n' + code }
      ], controller.signal);
      
      if (response) {
        setCode(response);
        if (addMessage) {
          addMessage({ role: 'assistant', content: response });
        }
        showToast.warning({
          title: '🔍 Debug Complete',
          description: 'Code has been analyzed and improved. Check the editor for changes!',
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('Error debugging code:', error);
      showToast.error({
        title: '❌ Debug Failed',
        description: 'Unable to analyze your code. Please try again or make sure your code is valid.',
        duration: 4000
      });
    } finally {
      setIsDebugging(false);
      setIsProcessing(false);
    }
  }, [isProcessing, code, messages, addMessage]);

  const handleImprove = useCallback(async () => {
    if (isProcessing || !code) return;

    const controller = new AbortController();
    setPromptCount(prev => prev + 1);
    setIsProcessing(true);
    setIsImproving(true);
    setCurrentOperation('improve');

    try {
      const response = await getCodeSuggestions([
        ...messages,
        { role: 'user', content: 'Improve this code by making it more efficient and adding helpful comments:\n\n' + code }
      ], controller.signal);
      
      if (response) {
        setCode(response);
        if (addMessage) {
          addMessage({ role: 'assistant', content: response });
        }
        showToast.success({
          title: '✨ Code Improved',
          description: 'Your code has been enhanced with better practices and comments!',
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('Error improving code:', error);
      showToast.error({
        title: '❌ Improvement Failed',
        description: 'Unable to improve your code. Please try again or check if the code is valid.',
        duration: 4000
      });
    } finally {
      setIsImproving(false);
      setIsProcessing(false);
    }
  }, [isProcessing, code, messages, addMessage]);

  const cancelOperation = useCallback(() => {
    setIsProcessing(false);
    setIsImproving(false);
    setIsDebugging(false);
  }, []);

  return (
    <EditorContext.Provider
      value={{
        code,
        setCode,
        isProcessing,
        isImproving,
        isDebugging,
        currentOperation,
        promptCount,
        handleClear,
        handleGenerate,
        handleDebug,
        handleImprove,
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