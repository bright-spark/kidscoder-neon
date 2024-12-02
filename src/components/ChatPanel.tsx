import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { showToast } from '@/lib/toast';
import { ChevronRight, Code2, Send, Loader2, Trash2, Wand2 } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useEditor } from '@/contexts/EditorContext';
import { generateCode } from '@/lib/ai-provider';
import { ButtonSlider } from './ButtonSlider';
import { cn } from '@/lib/utils';

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
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [processingMessageIndex, setProcessingMessageIndex] = useState<number | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);
  const [unusedStarters, setUnusedStarters] = useState<string[]>([]);
  const { messages, addMessage, clearMessages, clearLastMessage, contextId } = useChat();
  const { setCode } = useEditor();
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
    if (!prompt.trim() || isLoading) return;

    const controller = new AbortController();
    setAbortController(controller);
    const userMessage = { role: 'user', content: prompt };
    
    try {
      setIsLoading(true);
      onProcessingStart(controller);
      setHasSubmitted(true);
      setFirstPromptSent(true);
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
        showToast.success({
          title: 'Code Generated',
          description: 'Your code has been generated and is ready in the editor.',
        });
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        onSwitchToEditor();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        handleCancel();
        showToast.system({
          title: 'Generation cancelled',
          description: 'Code generation was cancelled.',
        });
      } else {
        console.error('Generation error:', error);
        showToast.error({
          title: 'Error',
          description: error.message || 'Failed to generate code. Please try again.',
        });
      }
    } finally {
      resetState();
      setProcessingMessageIndex(null);
      setAbortController(null);
    }
  };

  const handleStarter = () => {
    if (isLoading || hasSubmitted) return;
    
    const starters = [
      // Beginner Projects (Ages 4-7)
      "Create a counting game with colorful numbers and animal sounds",
      "Build a simple alphabet learning app with pictures",
      "Make a color matching game with basic shapes",
      "Design a virtual sticker book with drag-and-drop",
      "Create a basic pattern matching game with shapes",
      "Build a simple musical instrument with animal sounds",
      "Make a digital coloring book with easy tools",
      "Design a basic number tracing game",
      "Create a simple memory game with fruits",
      "Build a virtual fish tank with interactive fish",

      // Elementary Projects (Ages 8-10)
      "Create a multiplication tables game with rewards",
      "Build a spelling practice app with voice feedback",
      "Make a basic math quiz with animated characters",
      "Design a simple typing game with falling words",
      "Create a basic pixel art editor",
      "Build a virtual pet care simulator",
      "Make a simple weather dashboard with animations",
      "Design a basic maze game with levels",
      "Create a story generator with choices",
      "Build a simple music maker with different instruments",

      // Intermediate Projects (Ages 11-13)
      "Create a space exploration game with planet facts",
      "Build a virtual science lab with experiments",
      "Make a word puzzle game with hints",
      "Design a basic coding blocks interface",
      "Create a geography quiz with interactive maps",
      "Build a simple chat bot with responses",
      "Make a basic physics simulation",
      "Design a virtual garden with plant growth",
      "Create a simple 2D platformer game",
      "Build a basic animation creator",

      // Advanced Projects (Ages 14-17)
      "Create a full-featured calculator with scientific functions",
      "Build a complex rhythm game with scoring",
      "Make a sophisticated drawing app with layers",
      "Design a chess game with AI opponent",
      "Create a virtual chemistry lab with reactions",
      "Build a music composition tool with multiple tracks",
      "Make a 3D geometry visualization tool",
      "Design a complex puzzle game with physics",
      "Create a virtual robotics simulator",
      "Build an advanced weather prediction app",

      // Creative Tools
      "Create a comic strip maker with templates",
      "Build a digital storytelling app with scenes",
      "Make a music video creator with effects",
      "Design a 3D character creator",
      "Create an emoji designer with expressions",
      "Build a stop-motion animation studio",
      "Make a virtual art gallery creator",
      "Design a fashion design studio",
      "Create a sound effects mixer",
      "Build a virtual stage lighting designer",

      // Educational Games
      "Create an interactive periodic table",
      "Build a historical timeline explorer",
      "Make a language learning game with pronunciation",
      "Design a math problem solver with steps",
      "Create a grammar correction game",
      "Build a coding concept visualizer",
      "Make a geometry proof helper",
      "Design a virtual biology lab",
      "Create a physics puzzle game",
      "Build a chemistry molecule builder",

      // STEM Projects
      "Create a simple circuit simulator",
      "Build a basic 3D printer interface",
      "Make a solar system simulator",
      "Design a DNA structure explorer",
      "Create a simple machine simulator",
      "Build a basic robotics controller",
      "Make an ecosystem simulator",
      "Design a weather station dashboard",
      "Create a basic AI demonstration",
      "Build a renewable energy simulator",

      // Game Development
      "Create a snake game with power-ups",
      "Build a tetris clone with themes",
      "Make a pong game with special effects",
      "Design a breakout game with levels",
      "Create a memory card game with categories",
      "Build a word search puzzle maker",
      "Make a simple RPG battle system",
      "Design a tower defense game",
      "Create a racing game with tracks",
      "Build a space shooter with upgrades",

      // Creative Coding
      "Create a fractal generator with controls",
      "Build a particle system simulator",
      "Make a generative art creator",
      "Design a virtual kaleidoscope",
      "Create a pattern generator with rules",
      "Build a creative coding playground",
      "Make an interactive art installation",
      "Design a music visualizer",
      "Create a virtual fireworks display",
      "Build a creative math art tool",

      // Real-World Applications
      "Create a basic budget tracker",
      "Build a homework planner with reminders",
      "Make a recipe calculator with conversions",
      "Design a simple blog creator",
      "Create a basic inventory system",
      "Build a time management tool",
      "Make a simple quiz maker",
      "Design a basic presentation tool",
      "Create a simple data visualizer",
      "Build a basic project management app"
    ];
    
    // Initialize unused starters if empty
    if (unusedStarters.length === 0) {
      setUnusedStarters([...starters]);
    }

    // Get random starter from unused list
    const randomIndex = Math.floor(Math.random() * unusedStarters.length);
    const selectedStarter = unusedStarters[randomIndex];
    
    // Remove selected starter from unused list
    const updatedUnusedStarters = [...unusedStarters];
    updatedUnusedStarters.splice(randomIndex, 1);
    setUnusedStarters(updatedUnusedStarters);

    // If all starters used, reset the list
    if (updatedUnusedStarters.length === 0) {
      setUnusedStarters([...starters]);
    }

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
      description: 'Chat history and context have been cleared.',
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

  return (
    <Card className="flex h-full flex-col overflow-hidden border-none bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between border-b p-2 sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-2">
          <ChevronRight className="h-8 w-8 text-purple-500" />
          <h2 className="text-lg font-semibold hidden md:block">Prompt</h2>
          <ButtonSlider options={buttonOptions} className="absolute right-2 top-1/2 -translate-y-1/2 max-w-[calc(100%-120px)] md:max-w-[70%]" />
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {messages.map((message, index) => (
          <div
            key={`${contextId}-${index}`}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`rounded-lg px-4 py-2 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-purple-500/80 text-white'
                  : 'bg-purple-900/90 text-white'
              }`}
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

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to create?"
            className="min-h-[80px] bg-purple-500/5 border-2 border-purple-500/30 text-purple-400 placeholder:text-purple-300/50 focus:border-purple-400 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(147,51,234,0.2)] focus:shadow-[0_0_25px_rgba(147,51,234,0.4)]"
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
            disabled={!prompt.trim() || isLoading}
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
  );
}