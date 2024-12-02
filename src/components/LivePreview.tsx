import { useEditor } from '@/contexts/EditorContext';
import { usePreview } from '@/contexts/PreviewContext';
import { useEffect } from 'react';

export function LivePreview() {
  const { code } = useEditor();
  const { setHtml } = usePreview();

  useEffect(() => {
    console.log('Setting HTML for preview:', code);
    setHtml(code);
  }, [code, setHtml]);

  return null; // Preview is now handled by PreviewContext
}