import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { useEditor } from '@/contexts/EditorContext';
import { useChat } from '@/contexts/ChatContext';
import { usePreview } from '@/contexts/PreviewContext';
import { showToast } from '@/lib/toast';
import { saveAs } from 'file-saver';
import { ButtonSlider } from './ButtonSlider';
import { LivePreview } from './LivePreview';
import JSZip from 'jszip';
import { ProcessingOverlay } from './ProcessingOverlay'; 
import Editor from '@monaco-editor/react';
import {
  MessageSquare,
  Layout,
  ChevronRight,
  Code2,
  Download,
  Undo2,
  Redo2,
  Bug,
  Wand2,
  Loader2,
} from 'lucide-react';
// @ts-ignore
const classNames: any = require('classnames');

interface CodeEditorProps {
  onSwitchToChat: () => void;
  showPreview: boolean;
  onPreviewChange: (show: boolean) => void;
}

export function CodeEditor({ onSwitchToChat, showPreview, onPreviewChange }: CodeEditorProps) {
  const { theme } = useTheme();
  const { code, setCode, handleDebug: debugCode, handleImprove: improveCode, isProcessing, cancelOperation } = useEditor();
  const { messages, addMessage } = useChat();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDebugging, setIsDebugging] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const editorRef = useRef<any>(null);
  const { setHtml } = usePreview();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [isIconVisible, setIsIconVisible] = useState(true);
  const iconRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkOverlap = () => {
      if (!iconRef.current || !sliderRef.current) return;
      const iconRect = iconRef.current.getBoundingClientRect();
      const sliderRect = sliderRef.current.getBoundingClientRect();
      setIsIconVisible(iconRect.right < sliderRect.left);
    };

    const observer = new ResizeObserver(checkOverlap);
    if (sliderRef.current) {
      observer.observe(sliderRef.current);
    }

    return () => observer.disconnect();
  }, []);

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
      
      showToast.success({
        title: 'Download complete',
        description: 'Your code has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error downloading code:', error);
      showToast.error({
        title: 'Download failed',
        description: 'Failed to create zip file. Please try again.',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    // Set up editor options after mount
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      wordWrap: 'on',
      lineNumbers: 'on',
      folding: true,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      tabSize: 2,
      insertSpaces: true,
      formatOnPaste: true,
      formatOnType: true,
    });
  };

  const handleUndo = () => {
    editorRef.current?.trigger('keyboard', 'undo');
  };

  const handleRedo = () => {
    editorRef.current?.trigger('keyboard', 'redo');
  };

  const updatePreview = (newCode: string) => {
    const previewHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          <style>
            html, body { margin: 0; padding: 0; height: 100%; }
            #root { height: 100%; }
          </style>
        </head>
        <body>
          ${newCode}
          <script>
            window.onerror = function(msg, url, line) {
              console.error('Error: ' + msg + '\\nLine: ' + line);
              return false;
            };
          </script>
        </body>
      </html>
    `;
    setHtml(previewHtml);
  };

  const handlePreviewToggle = () => {
    onPreviewChange(!showPreview);
  };

  useEffect(() => {
    if (showPreview) {
      updatePreview(code);
    }
  }, [code, showPreview]);

  const buttonOptions = [
    {
      icon: showPreview ? <Code2 className="h-4 w-4" /> : <Layout className="h-4 w-4" />,
      label: showPreview ? 'Editor' : 'Preview',
      onClick: handlePreviewToggle,
      intent: 'preview' as const,
    },
    {
      icon: <ChevronRight className="h-4 w-4" />,
      label: 'Prompt',
      onClick: onSwitchToChat,
      intent: 'primary' as const,
    },
    {
      icon: isDebugging ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />,
      label: 'Debug',
      intent: 'debug' as const,
      onClick: async () => {
        setIsDebugging(true);
        try {
          await debugCode();
        } catch (error) {
          console.error('Debug error:', error);
        }
        setIsDebugging(false);
      },
      disabled: isDebugging || !code,
    },
    {
      icon: isImproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />,
      label: 'Improve',
      intent: 'improve' as const,
      onClick: async () => {
        setIsImproving(true);
        try {
          await improveCode();
        } catch (error) {
          console.error('Improve error:', error);
        }
        setIsImproving(false);
      },
      disabled: isImproving || !code,
    },
    {
      icon: isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />,
      label: 'Download',
      onClick: async () => {
        await handleDownload();
      },
      disabled: isDownloading || !code,
      intent: 'success' as const,
    },
  ];

  return (
    <>
      <ProcessingOverlay 
        isVisible={isProcessing}
        onCancel={cancelOperation} />
      <Card className="flex h-full flex-col overflow-hidden border-none bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
        <div className="flex items-center justify-between border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex items-center gap-1 sm:gap-2 py-2 pl-2">
            <div ref={iconRef} className={classNames(
              "transition-opacity duration-200",
              isIconVisible ? "opacity-100" : "opacity-0"
            )}>
              <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
            </div>
            <h2 className="text-lg font-semibold hidden md:block shrink-0">
              {showPreview ? 'Preview' : 'Editor'}
            </h2>
            {!showPreview && window.innerWidth >= 640 && (
              <div className="flex gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  title="Undo (Ctrl+Z)"
                  className="hover:bg-purple-500/80"
                >
                  <Undo2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRedo}
                  title="Redo (Ctrl+Y)"
                  className="hover:bg-purple-500/80"
                >
                  <Redo2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                </Button>
              </div>
            )}
          </div>
          <div ref={sliderRef} className="sticky right-0 flex-grow flex justify-end">
            <ButtonSlider 
              options={buttonOptions} 
              className="min-w-0 pr-1" 
            />
          </div>
<div ref={iconRef} className={classNames(
  "transition-opacity duration-200",
  isIconVisible ? "opacity-100" : "opacity-0"
)}>
  <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
</div><div ref={iconRef} className={classNames(
  "transition-opacity duration-200",
  isIconVisible ? "opacity-100" : "opacity-0"
)}>
  <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
</div><div ref={iconRef} className={classNames(
  "transition-opacity duration-200",
  isIconVisible ? "opacity-100" : "opacity-0"
)}>
  <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
</div><div ref={iconRef} className={classNames(
  "transition-opacity duration-200",
  isIconVisible ? "opacity-100" : "opacity-0"
)}>
  <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
</div><div ref={iconRef} className={classNames(
  "transition-opacity duration-200",
  isIconVisible ? "opacity-100" : "opacity-0"
)}>
  <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
</div><div ref={iconRef} className={classNames(
  "transition-opacity duration-200",
  isIconVisible ? "opacity-100" : "opacity-0"
)}>
  <Code2 className="h-5 w-5 md:h-8 md:w-8 text-purple-500 shrink-0" />
</div>        </div>

        <div className="relative flex-1 overflow-hidden">
          {showPreview ? (
            <LivePreview />
          ) : (
            <div className="relative h-full">
              {!code && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Code2 className="h-20 w-20 md:h-32 md:w-32 text-purple-500" />
                </div>
              )}
              <Editor
                height="100%"
                defaultLanguage="html"
                defaultValue={code}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme={theme === 'light' ? 'vs-light' : 'vs-dark'}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  tabSize: 2,
                  insertSpaces: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}