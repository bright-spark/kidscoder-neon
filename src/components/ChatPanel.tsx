import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from '@/lib/toast';
import { ChevronRight, Code2, Send, Loader2, Trash2, Wand2 } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useEditor } from '@/contexts/EditorContext';
import { generateCode } from '@/lib/ai-provider';
import { ButtonSlider } from './ButtonSlider';
import { ProcessingOverlay } from './ProcessingOverlay';
import { cn } from '@/lib/utils';
import styles from './ChatPanel.module.css';

function formatChatMessage(content: string): string {
  // Remove code blocks and their content
  return content.replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`[^`]+`/g, '')
    // Trim whitespace
    .trim();
}

interface ChatPanelProps {
  onSwitchToEditor: () => void;
  onProcessingStart: (controller: AbortController) => void;
  onProcessingEnd: () => void;
}

export function ChatPanel({ onSwitchToEditor, onProcessingStart, onProcessingEnd }: ChatPanelProps) {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState<number | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [unusedStarters, setUnusedStarters] = useState<string[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { messages, addMessage, clearMessages, clearLastMessage, contextId } = useChat();
  const { setCode, promptCount } = useEditor();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [firstPromptSent, setFirstPromptSent] = useState(false);

  const resetState = () => {
    setIsLoading(false);
    setProcessingMessageIndex(null);
    setAbortController(null);
    setIsCancelled(false);
    onProcessingEnd();
  };

  const handleCancel = () => {
    if (abortController) {
      abortController.abort();
      setIsCancelled(true);
      clearLastMessage();
      resetState();
      setAbortController(null);
    }
  };

  const handleSubmit = async () => {
    if (!prompt?.trim() || isLoading) return;

    const controller = new AbortController();
    setAbortController(controller);
    setIsLoading(true);
    setHasSubmitted(true);
    setElapsedTime(0);
    
    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    try {
      const userMessage = { role: 'user', content: prompt };
      
      addMessage(userMessage);
      
      const newMessageIndex = messages.length;
      setProcessingMessageIndex(newMessageIndex);
      
      const response = await generateCode(prompt, messages, controller.signal);
      
      if (response) {
        // Only store the message content in chat history
        const messageContent = 'Generated code is ready in the editor';
        addMessage({ role: 'assistant', content: messageContent });
        
        // Store the actual code in editor state
        // Only store the generated code in editor state, not in chat history
        const codeOnly = response.replace(/^.*?<!DOCTYPE/m, '<!DOCTYPE');
        setCode(response);
        setPrompt('');
        showToast.system({
          title: 'Code Generated',
          description: 'Your code has been generated and is ready in the editor.',
          duration: 2000
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        onSwitchToEditor();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        handleCancel();
        showToast.error({
          title: 'Generation cancelled',
          description: 'Code generation was cancelled.',
          duration: 2000
        });
      } else {
        console.error('Generation error:', error);
        showToast.error({
          title: 'Error',
          description: error.message || 'Failed to generate code. Please try again.',
          duration: 2000
        });
      }
    } finally {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsLoading(false);
      setAbortController(null);
      onProcessingEnd();
    }
  };

  const handleStarter = () => {
    if (isLoading || hasSubmitted) return;
    
    const starters = [
      // Beginner Concepts (Ages 4-7)
      "Create a simple counting game",
      "Make a color matching activity",
      "Build a basic shape sorter",
      "Design a musical toy",
      "Make an alphabet explorer",

      // Elementary Concepts (Ages 8-10)
      "Create a math quiz game",
      "Build a typing challenge",
      "Make a memory card game",
      "Design a simple paint program",
      "Build a word scramble game",

      // Intermediate Concepts (Ages 11-13)
      "Create a platformer game",
      "Build a puzzle solver",
      "Make a space shooter",
      "Design a music maker",
      "Build a story generator"
    ];

    // Filter out already used starters
    const availableStarters = starters.filter(starter => !unusedStarters.includes(starter));
    
    if (availableStarters.length === 0) {
      // Reset if all starters have been used
      setUnusedStarters([]);
      return handleStarter();
    }

    // Pick a random starter
    const randomIndex = Math.floor(Math.random() * availableStarters.length);
    const selectedStarter = availableStarters[randomIndex];
    
    // Add to used starters
    setUnusedStarters([...unusedStarters, selectedStarter]);
    
    // Set as prompt
    setPrompt(selectedStarter);
  };

  const handleClear = () => {
    clearMessages();
    setCode('');
    setPrompt('');
    setHasSubmitted(false);
    resetState();
    showToast.success({
      title: 'Chat cleared',
      description: 'Chat history has been cleared.',
      duration: 2000
    });
  };

  const buttonOptions = [
    // Only show starter button if no messages exist and user hasn't submitted yet
    ...(messages.length === 0 && !hasSubmitted ? [{
      icon: <Wand2 className="mr-2 h-4 w-4" />,
      label: 'Starter',
      onClick: handleStarter,
      intent: 'preview' as const,
      disabled: isLoading,
    }] : []),
    // Only show editor and clear buttons after first prompt
    ...(messages.length > 0 ? [
      {
        icon: <Code2 className="mr-2 h-4 w-4" />,
        label: 'Editor',
        onClick: onSwitchToEditor,
        intent: 'preview' as const,
      },
      {
        icon: <Trash2 className="mr-2 h-4 w-4" />,
        label: 'Clear',
        onClick: handleClear,
        intent: 'debug' as const,
        disabled: isLoading,
      }
    ] : [])
  ];

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <>
      <Card className={styles.card}>
        {isLoading && (
          <ProcessingOverlay
            isVisible={isLoading}
            operation="prompt"
          />
        )}
        <div className={styles.header}>
          <div className="flex items-center gap-2">
            <ChevronRight className="h-8 w-8 text-purple-500" />
            <h2 className="text-lg font-semibold hidden md:block">Prompt</h2>
            <ButtonSlider options={buttonOptions} className="absolute right-2 top-1/2 -translate-y-1/2 max-w-[calc(100%-120px)] md:max-w-[70%]" />
          </div>
        </div>

        <div
          ref={scrollRef}
          className={styles.chatContainer}
        >
          {messages.map((message, index) => (
            <div
              key={`${contextId}-${index}`}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={cn(
                  styles.message,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                )}
              >
                {index === processingMessageIndex ? (
                  isCancelled ? (
                    <div className="flex items-center gap-2 text-red-200" role="status">
                      <XCircle className="h-4 w-4 text-red-200" />
                      <span>Cancelled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2" role="status">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  )
                ) : (
                  <div 
                    className={cn(
                      "whitespace-pre-wrap font-sans",
                      message.role === 'assistant' && "text-left"
                    )}>
                    {formatChatMessage(message.content)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.footer}>
          <div className="flex gap-2">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What would you like to create?"
              className={styles.chatInput}
              disabled={isLoading}
              aria-label="Chat input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              onClick={handleSubmit}
              disabled={!prompt?.trim() || isLoading}
              aria-label={isLoading ? "Generating response..." : "Send message"}
              className="px-3 bg-purple-500/90 text-white border-2 border-purple-300 shadow-[0_0_25px_rgba(147,51,234,0.9)] hover:shadow-[0_0_35px_rgba(147,51,234,1)] hover:bg-purple-600/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}