import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useEditor } from '@/contexts/EditorContext';
import { usePreview } from '@/contexts/PreviewContext';

export function LivePreview() {
  const { code } = useEditor();
  const { html, setHtml } = usePreview();

  // Update preview when code changes or component mounts
  useEffect(() => {
    const updatePreview = () => {
      if (!code) {
        setHtml('');
        return;
      }

      // Basic HTML wrapper for preview
      const previewHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
              html, body { 
                margin: 0; 
                padding: 0; 
                height: 100%;
                background: linear-gradient(135deg, rgba(250, 245, 255, 0.8) 0%, rgba(243, 232, 255, 0.8) 100%);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
              }
              #root { 
                height: 100%;
                background: radial-gradient(circle at center, rgba(233, 213, 255, 0.3) 0%, rgba(250, 245, 255, 0.1) 100%);
                position: relative;
              }
              #root::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.2) 100%);
                pointer-events: none;
              }
              /* Pearl effect overlay */
              #root::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: 
                  radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.3) 0%, transparent 50%),
                  radial-gradient(circle at 70% 60%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
                pointer-events: none;
                mix-blend-mode: soft-light;
              }
            </style>
          </head>
          <body>
            ${code}
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

    updatePreview();

    // Force reload when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePreview();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [code, setHtml]);

  return (
    <Card className="h-full overflow-hidden bg-gradient-to-br from-purple-50/90 via-purple-100/80 to-purple-50/90 backdrop-blur-md supports-[backdrop-filter]:bg-purple-50/70 border border-purple-200/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4)_0%,transparent_60%)] pointer-events-none" />
      <iframe
        key={code} // Force iframe refresh when code changes
        title="preview"
        srcDoc={html}
        className="h-full w-full border-none relative z-10"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
      />
    </Card>
  );
}