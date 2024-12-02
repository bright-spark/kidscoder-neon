import React, { useEffect, useRef, useState } from 'react';
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react';

interface CodeSandboxProps {
  code: string;
  className?: string;
  onError?: (error: string) => void;
}

export const CodeSandbox: React.FC<CodeSandboxProps> = ({ 
  code, 
  className = '',
  onError 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const generateHTML = (code: string) => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Code Preview</title>
          <style>
            body { 
              margin: 0; 
              padding: 16px;
              font-family: system-ui, -apple-system, sans-serif;
            }
            /* Add default styles for better appearance */
            button {
              padding: 8px 16px;
              margin: 4px;
              border-radius: 4px;
              border: 1px solid #ccc;
              background: #fff;
              cursor: pointer;
            }
            button:hover {
              background: #f0f0f0;
            }
            input, textarea {
              padding: 8px;
              margin: 4px;
              border-radius: 4px;
              border: 1px solid #ccc;
            }
          </style>
          <script>
            // Error handling
            window.onerror = function(msg, url, line, col, error) {
              window.parent.postMessage({
                type: 'error',
                message: \`\${msg} (Line \${line})\`
              }, '*');
              return false;
            };
            // Console override
            const originalConsole = { ...console };
            console.log = function(...args) {
              originalConsole.log(...args);
              window.parent.postMessage({
                type: 'console',
                message: args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                ).join(' ')
              }, '*');
            };
          </script>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  };

  const refreshPreview = () => {
    setIsLoading(true);
    if (iframeRef.current) {
      const html = generateHTML(code);
      iframeRef.current.srcdoc = html;
    }
  };

  useEffect(() => {
    refreshPreview();
  }, [code, refreshPreview]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'error' && onError) {
        onError(event.data.message);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <div className="absolute top-2 right-2 flex gap-2 z-10">
        <button
          onClick={refreshPreview}
          className="p-1 rounded bg-white/90 hover:bg-white shadow-sm border"
          title="Refresh preview"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded bg-white/90 hover:bg-white shadow-sm border"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full h-full min-h-[300px] bg-white rounded-lg shadow-sm border"
        sandbox="allow-scripts allow-popups allow-forms"
        onLoad={handleLoad}
      />
    </div>
  );
};
