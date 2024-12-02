import { Card } from '@/components/ui/card';
import { useEditor } from '@/contexts/EditorContext';
import { CodeSandbox } from './CodeSandbox';

export function LivePreview() {
  const { code } = useEditor();

  return (
    <Card className="h-full overflow-hidden bg-gradient-to-br from-purple-50/90 via-purple-100/80 to-purple-50/90 backdrop-blur-md supports-[backdrop-filter]:bg-purple-50/70 border border-purple-200/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4)_0%,transparent_60%)] pointer-events-none" />
      <CodeSandbox key={code} code={code} onError={(msg) => console.error(msg)} />
    </Card>
  );
}