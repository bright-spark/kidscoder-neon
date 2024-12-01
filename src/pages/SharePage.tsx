import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LivePreview } from '@/components/LivePreview';
import { usePreview } from '@/contexts/PreviewContext';
import { useEditor } from '@/contexts/EditorContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code2, Loader2 } from 'lucide-react';

interface SharePageProps {
  id: string;
}

export function SharePage({ id }: SharePageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setHtml } = usePreview();
  const { setCode } = useEditor();
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    async function loadSharedCode() {
      try {
        const { data, error } = await supabase
          .from('code_snippets')
          .select('code')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Code not found');

        setCode(data.code);

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
              ${data.code}
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
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading shared code:', err);
        setError(err instanceof Error ? err.message : 'Failed to load code');
        setIsLoading(false);
      }
    }

    loadSharedCode();
  }, [id, setHtml, setCode]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-destructive">Error</h1>
          <p className="mt-2 text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-screen">
      <div className="absolute right-4 top-4 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditor(!showEditor)}
          className="bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        >
          <Code2 className="mr-2 h-4 w-4" />
          {showEditor ? 'Hide Code' : 'View Code'}
        </Button>
      </div>
      <LivePreview />
    </div>
  );
}