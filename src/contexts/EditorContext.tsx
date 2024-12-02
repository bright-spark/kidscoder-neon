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
  const { messages, addMessage, updateTotalCharacters } = useChat();

  const handleClear = useCallback(() => {
    setCode('');
  }, []);

  const handleGenerate = useCallback(async (prompt: string) => {
    if (isProcessing) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsProcessing(true);

    try {
      const generatedCode = await getCodeSuggestions('', prompt, messages, controller.signal);
      
      if (generatedCode) {
        setCode(generatedCode);
        addMessage({ role: 'assistant', content: generatedCode });
        updateTotalCharacters(generatedCode.length);
      }
    } catch (error: any) {
      console.error('Error generating code:', error);
      showToast.error({
        title: 'Generation failed',
        description: error.message || 'Failed to generate code. Please try again.',
        duration: 2000
      });
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  }, [isProcessing, messages, addMessage, updateTotalCharacters]);

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
        description: 'Analyzing and fixing issues...',
        steps: [
          { label: 'Analyzing code', status: 'complete' },
          { label: 'Finding issues', status: 'loading' },
          { label: 'Suggesting fixes', status: 'pending' }
        ],
        progress: 33,
        duration: 3000
      });

      const debugPrompt = `As an expert code reviewer, analyze this code and provide a clear, structured assessment:

1. Code Quality Analysis:
   - Identify potential bugs, logic errors, or runtime issues
   - Highlight performance bottlenecks or inefficiencies
   - Check for security vulnerabilities

2. Best Practices Review:
   - Evaluate code organization and structure
   - Check for proper error handling
   - Assess browser compatibility issues
   - Review accessibility compliance

3. Specific Recommendations:
   - List concrete issues found
   - Explain the potential impact of each issue
   - Provide clear, actionable solutions

Format your response as a concise, bullet-pointed list without including any code blocks. Focus on practical solutions that maintain the code's original functionality.`;
      
      const debugResponse = await getCodeSuggestions(code, debugPrompt, messages, controller.signal);
      
      if (debugResponse) {
        const cleanResponse = debugResponse
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/`[^`]*`/g, '') // Remove inline code
          .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
          .trim();
          
        if (cleanResponse) {
          addMessage({ 
            role: 'assistant', 
            content: cleanResponse
          });
          updateTotalCharacters(cleanResponse.length + code.length);
        }
        
        showToast.success({
          title: 'Debug complete',
          description: 'Check the chat for debug information.',
          duration: 2000
        });
      }
    } catch (error: any) {
      console.error('Error debugging code:', error);
      showToast.error({
        title: 'Debug failed',
        description: error.message || 'Failed to debug code. Please try again.',
        duration: 2000
      });
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  }, [code, isProcessing, messages, addMessage, updateTotalCharacters]);

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
        duration: 3000
      });
      
      const improvePrompt = `As a senior software architect specializing in modern web development, enhance this code following industry best practices and cutting-edge patterns. 

OBJECTIVE:
Transform the code while maintaining its core functionality, focusing on:
- Performance optimization
- Code maintainability
- Error resilience
- User experience
- Accessibility (WCAG 2.1)
- Cross-browser compatibility

REQUIRED IMPROVEMENTS:

1. Architecture & Design:
   - Apply SOLID principles
   - Implement modern design patterns
   - Optimize component structure
   - Enhance code modularity
   - Improve state management
   - Add proper TypeScript types/interfaces

2. Performance Optimization:
   - Implement code splitting where beneficial
   - Optimize resource loading
   - Enhance render performance
   - Minimize unnecessary re-renders
   - Add proper memoization
   - Implement lazy loading

3. Error Handling & Reliability:
   - Add comprehensive error boundaries
   - Implement proper error recovery
   - Add input validation
   - Include error logging
   - Add fallback states
   - Implement retry mechanisms

4. User Experience & Accessibility:
   - Enhance keyboard navigation
   - Add ARIA attributes
   - Improve focus management
   - Add loading states
   - Implement proper semantic HTML
   - Add responsive design patterns

5. Testing & Maintainability:
   - Add error boundaries
   - Implement proper prop types
   - Add code documentation
   - Improve naming conventions
   - Enhance code organization

OUTPUT FORMAT:
1. First provide a brief, bullet-pointed summary of major improvements made
2. Then provide the complete improved code
3. Each major section should have descriptive comments explaining the improvements

CONSTRAINTS:
- Maintain original functionality while enhancing it
- Follow React/TypeScript best practices
- Ensure backward compatibility
- Keep bundle size optimized
- Maintain responsive design
- Follow accessibility guidelines

Apply these improvements systematically while maintaining code readability and documenting significant changes.`;
      
      const response = await getCodeSuggestions(code, improvePrompt, messages, controller.signal);
      
      if (response) {
        const [explanation, ...codeParts] = response.split('```');
        
        const improvedCode = codeParts.length > 0 
          ? codeParts.join('```').replace(/^[a-z]*\n|`+$/g, '').trim()
          : response;
        
        setCode(improvedCode);
        
        const cleanExplanation = explanation
          .replace(/`[^`]*`/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
          
        if (cleanExplanation) {
          addMessage({ 
            role: 'assistant', 
            content: cleanExplanation || 'Code has been improved. Check the editor to see the changes.'
          });
          updateTotalCharacters(cleanExplanation.length + improvedCode.length);
        }
        
        showToast.success({
          title: 'Code improved',
          description: 'The code has been improved and updated in the editor.',
          duration: 2000
        });
      }
    } catch (error: any) {
      console.error('Error improving code:', error);
      showToast.error({
        title: 'Improvement failed',
        description: error.message || 'Failed to improve code. Please try again.',
        duration: 2000
      });
    } finally {
      setIsProcessing(false);
      setAbortController(null);
    }
  }, [code, isProcessing, messages, addMessage, updateTotalCharacters]);

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
        handleShare,
        handleClear,
        handleGenerate,
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