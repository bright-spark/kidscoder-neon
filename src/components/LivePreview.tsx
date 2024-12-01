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
              html, body { margin: 0; padding: 0; height: 100%; }
              #root { height: 100%; }
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
    <Card className="h-full bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <iframe
        key={code} // Force iframe refresh when code changes
        title="preview"
        srcDoc={html}
        className="h-full w-full border-none"
        sandbox="allow-scripts allow-modals allow-forms allow-same-origin allow-popups allow-downloads"
      />
    </Card>
  );
}