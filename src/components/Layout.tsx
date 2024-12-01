import { useState } from 'react';
import {
  Menu,
  Sparkles,
  MessageSquare,
  Code2,
  Share2,
  Wand2,
  Bug,
  Eye,
  Moon,
  Sun,
  Laptop,
  Trash2
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
import { cn } from '@/lib/utils';

export function Layout() {
  const [activePanel, setActivePanel] = useState('chat');
  const [isProcessing, setIsProcessing] = useState(false);
  const { theme, setTheme } = useTheme();
  const { messages, clearMessages, contextId } = useChat();
  const { code, setCode, handleShare, handleDebug, handleImprove, cancelOperation } = useEditor();
  const { toast } = useToast();
  
  const hasContent = messages.length > 0;
  const [showPreview, setShowPreview] = useState(false);
  
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

  const menuGroups = [
    {
      title: 'Navigation',
      items: [
        {
          icon: <MessageSquare className="h-4 w-4" />,
          label: 'Chat',
          onClick: () => setActivePanel('chat'),
          active: activePanel === 'chat',
          intent: 'primary' as const
        },
        {
          icon: <Code2 className="h-4 w-4" />,
          label: 'Editor',
          onClick: () => setActivePanel('editor'),
          active: activePanel === 'editor',
          disabled: !hasContent,
          intent: 'primary' as const
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
          disabled: activePanel !== 'editor' || !code,
          intent: 'preview' as const
        },
        {
          icon: <Share2 className="h-4 w-4" />,
          label: 'Share Code',
          onClick: () => handleShare(),
          disabled: activePanel !== 'editor' || !code,
          intent: 'success' as const
        },
        {
          icon: <Bug className="h-4 w-4" />,
          label: 'Debug',
          onClick: () => handleDebug(),
          disabled: activePanel !== 'editor' || !code,
          intent: 'secondary' as const
        },
        {
          icon: <Wand2 className="h-4 w-4" />,
          label: 'Improve',
          onClick: () => handleImprove(),
          disabled: activePanel !== 'editor' || !code,
          intent: 'secondary' as const
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
          active: theme === 'light'
        },
        {
          icon: <Moon className="h-4 w-4" />,
          label: 'Dark',
          onClick: () => setTheme('dark'),
          active: theme === 'dark'
        },
        {
          icon: <Laptop className="h-4 w-4" />,
          label: 'System',
          onClick: () => setTheme('system'),
          active: theme === 'system'
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
          disabled: !hasContent,
          intent: 'danger' as const
        }
      ]
    }
  ];

  const handleProcessingStart = (controller: AbortController) => {
    setIsProcessing(true);
  };

  const handleProcessingEnd = () => {
    setIsProcessing(false);
  };

  const handleCancel = () => {
    cancelOperation();
    setIsProcessing(false);
  };

  return (
    <div className="flex h-screen w-screen flex-col bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-background">
      <ProcessingOverlay isVisible={isProcessing} onCancel={handleCancel} />
      
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
        "h-[calc(100%-3.5rem)] md:h-[calc(100%-4rem)] p-4",
        "md:grid md:grid-cols-1 md:gap-4"
      )}>
        {activePanel === 'chat' ? (
          <ChatPanel 
            onSwitchToEditor={() => setActivePanel('editor')} 
            onProcessingStart={handleProcessingStart}
            onProcessingEnd={handleProcessingEnd}
          />
        ) : (
          <CodeEditor 
            onSwitchToChat={() => setActivePanel('chat')}
            showPreview={showPreview}
            onPreviewChange={setShowPreview}
          />
        )}
      </div>
    </div>
  );
}