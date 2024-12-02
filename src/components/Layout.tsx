import { useState } from 'react';
import {
  Menu,
  Sparkles,
  MessageSquare,
  Code2,
  Download,
  Wand2,
  Bug,
  Eye,
  Moon,
  Sun,
  Laptop,
  Trash2,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetClose
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/components/ThemeProvider';
import { useChat } from '@/contexts/ChatContext';
import { useEditor } from '@/contexts/EditorContext';
import { ChatPanel } from './ChatPanel';
import { CodeEditor } from './CodeEditor';
import { ProcessingOverlay } from './ProcessingOverlay';
import { LivePreview } from './LivePreview';
import { cn } from '@/lib/utils';
import { getCodeSuggestions } from '@/lib/openai';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export function Layout() {
  const [activePanel, setActivePanel] = useState('chat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<'prompt' | 'debug' | 'improve'>('prompt');
  const { theme, setTheme } = useTheme();
  const { messages, clearMessages } = useChat();
  const { code, setCode, cancelOperation } = useEditor();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const hasContent = messages.length > 0;

  const handleClear = () => {
    clearMessages();
    setCode('');
    setActivePanel('chat');
    toast({
      title: 'All cleared',
      description: 'Chat history, code and preview have been cleared.',
    });
  };

  const handlePreviewToggle = () => {
    if (activePanel === 'editor' && code) {
      setShowPreview(!showPreview);
    }
  };

  const handleDownload = async () => {
    if (!code) return;
    setIsDownloading(true);
    try {
      // Get the first user prompt to use as filename
      const firstPrompt = messages.find(m => m.role === 'user')?.content || 'project';
      const safeFileName = firstPrompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);

      const zip = new JSZip();
      zip.file('index.html', code);

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${safeFileName}.zip`);

      toast({
        title: 'Download complete',
        description: 'Your code has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading code:', error);
      toast({
        title: 'Download failed',
        description: 'Failed to create zip file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const menuGroups = [
    {
      title: 'Navigation',
      items: [
        {
          icon: <MessageSquare className="h-4 w-4" />,
          label: 'Chat',
          onClick: () => setActivePanel('chat'),
          active: activePanel === 'chat',
          intent: 'primary' as const,
          disabled: false
        },
        {
          icon: <Code2 className="h-4 w-4" />,
          label: 'Editor',
          onClick: () => setActivePanel('editor'),
          active: activePanel === 'editor',
          intent: 'primary' as const,
          disabled: !hasContent || isProcessing
        }
      ]
    },
    {
      title: 'Editor Tools',
      items: [
        {
          icon: <Eye className="h-4 w-4" />,
          label: 'Preview',
          onClick: handlePreviewToggle,
          active: showPreview,
          intent: 'preview' as const,
          disabled: activePanel !== 'editor' || !code
        },
        {
          icon: <Bug className="h-4 w-4" />,
          label: 'Debug',
          onClick: () => {},
          intent: 'secondary' as const,
          disabled: activePanel !== 'editor' || !code
        },
        {
          icon: <Wand2 className="h-4 w-4" />,
          label: 'Improve',
          onClick: () => {},
          intent: 'secondary' as const,
          disabled: activePanel !== 'editor' || !code
        },
        {
          icon: isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />,
          label: 'Download',
          onClick: handleDownload,
          intent: 'success' as const,
          disabled: activePanel !== 'editor' || !code || isDownloading
        }
      ]
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: <Sun className="h-4 w-4" />,
          label: 'Light',
          onClick: () => setTheme('light'),
          active: theme === 'light',
          intent: 'primary' as const,
          disabled: false
        },
        {
          icon: <Moon className="h-4 w-4" />,
          label: 'Dark',
          onClick: () => setTheme('dark'),
          active: theme === 'dark',
          intent: 'primary' as const,
          disabled: false
        },
        {
          icon: <Laptop className="h-4 w-4" />,
          label: 'System',
          onClick: () => setTheme('system'),
          active: theme === 'system',
          intent: 'primary' as const,
          disabled: false
        }
      ]
    },
    {
      title: 'Actions',
      items: [
        {
          icon: <Trash2 className="h-4 w-4" />,
          label: 'Clear All',
          onClick: handleClear,
          intent: 'danger' as const,
          disabled: !hasContent || isProcessing,
          active: activePanel === 'clear'
        }
      ]
    }
  ];

  const handleProcessingStart = (controller: AbortController) => {
    setIsProcessing(true);
    setCurrentOperation('prompt');

    getCodeSuggestions([], controller.signal)
      .then(response => {
        // Handle the response
        console.log(response);
      })
      .catch(error => {
        if (error.name === 'AbortError') {
          console.log('Request aborted');
        } else {
          console.error('Error:', error);
        }
      });
  };

  const handleProcessingEnd = () => {
    setIsProcessing(false);
    setCurrentOperation('prompt');
  };

  const handleCancel = () => {
    cancelOperation();
    setIsProcessing(false);
    setCurrentOperation('prompt');
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-background">
      <ProcessingOverlay isVisible={isProcessing} onCancel={handleCancel} operation={currentOperation} />

      {/* Mobile Navigation */}
      <div className="flex h-14 items-center justify-between border-b bg-background/60 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center">
          <div className="flex items-center gap-0 transition-all duration-200 ease-in-out">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <h1 className="ml-1 text-lg font-semibold transition-all duration-200 ease-in-out max-w-[120px] truncate sm:max-w-none">
              Kids Coder
            </h1>
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="right" 
            className="w-[80%] p-0 overflow-hidden"
            aria-label="Navigation menu"
          >
            <SheetTitle className="p-6 pb-4">Navigation</SheetTitle>
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {menuGroups.map((group, index) => (
                  <div key={group.title} className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium leading-none text-muted-foreground">{group.title}</h4>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <SheetClose asChild key={item.label}>
                            <Button
                              variant={item.active ? 'default' : 'ghost'}
                              className={cn(
                                "w-full justify-start",
                                item.active && "bg-primary text-primary-foreground hover:bg-primary/90"
                              )}
                              disabled={item.disabled}
                              onClick={item.onClick}
                              aria-label={item.label}
                            >
                              {item.icon}
                              <span className="ml-2">{item.label}</span>
                            </Button>
                          </SheetClose>
                        ))}
                      </div>
                    </div>
                    {index < menuGroups.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Header */}
      <div className="hidden border-b bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center">
            <div className="flex items-center gap-2 transition-all duration-200 ease-in-out">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <h1 className="text-lg font-semibold">Kids Coder</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={cn(
        "h-[calc(100%-3.5rem)] md:h-[calc(100%-4rem)]",
        "flex flex-col"
      )}>
        {activePanel === 'chat' ? (
          <ChatPanel 
            onSwitchToEditor={() => setActivePanel('editor')} 
            onProcessingStart={handleProcessingStart}
            onProcessingEnd={handleProcessingEnd}
          />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 min-h-0">
              <CodeEditor 
                onSwitchToChat={() => setActivePanel('chat')}
                showPreview={showPreview}
                onPreviewChange={setShowPreview}
              />
            </div>
            {showPreview && (
              <div className="flex-1 min-h-0">
                <LivePreview />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}