import { Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useEditor } from '@/contexts/EditorContext';

interface ProcessingOverlayProps {
  isVisible: boolean;
  operation: 'debug' | 'improve' | 'prompt';
}

export function ProcessingOverlay({ isVisible, operation }: ProcessingOverlayProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { promptCount } = useEditor();

  useEffect(() => {
    if (isVisible) {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const overlayColors = {
    improve: 'from-emerald-950/80 via-emerald-900/80 to-emerald-800/80',
    debug: 'from-rose-950/80 via-rose-900/80 to-rose-800/80',
    prompt: 'from-purple-950/80 via-purple-900/80 to-purple-800/80'
  };

  const textColors = {
    improve: 'text-emerald-50',
    debug: 'text-rose-50',
    prompt: 'text-purple-50'
  };

  const spinnerColors = {
    improve: 'text-emerald-400',
    debug: 'text-rose-400',
    prompt: 'text-purple-400'
  };

  const glowColors = {
    improve: 'shadow-emerald-500/20',
    debug: 'shadow-rose-500/20',
    prompt: 'shadow-purple-500/20'
  };

  const ringColors = {
    improve: 'ring-emerald-500/20',
    debug: 'ring-rose-500/20',
    prompt: 'ring-purple-500/20'
  };

  const headerColors = {
    improve: 'text-emerald-200',
    debug: 'text-rose-200',
    prompt: 'text-purple-200'
  };

  const operationLabels = {
    improve: 'Improving',
    debug: 'Debugging',
    prompt: 'Generating'
  };

  return (
    <div className={`fixed top-[47px] inset-x-0 bottom-0 z-50 flex items-center justify-center bg-gradient-to-br ${overlayColors[operation]} backdrop-blur-md`}>
      <div className={`flex flex-col items-center space-y-6 ${textColors[operation]}`}>
        <div className="flex flex-col items-center space-y-4 -mt-10">
          <div className={`text-lg font-medium ${headerColors[operation]}`}>
            {operationLabels[operation]} Code
          </div>
          <div className={`relative p-8 rounded-full bg-black/20 backdrop-blur-lg ${glowColors[operation]} shadow-[0_0_50px_rgba(0,0,0,0.3)]`}>
            <Loader2 className={`h-16 w-16 animate-spin ${spinnerColors[operation]}`} />
          </div>
        </div>

        <div className={`flex items-center gap-6 px-6 py-3 rounded-full backdrop-blur-lg bg-black/20 ring-1 ${ringColors[operation]}`}>
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">Time:</span>
            <span className="font-mono text-base tabular-nums">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <div className="w-px h-4 bg-current opacity-20" />
          <div className="flex items-center gap-2">
            <span className="text-sm opacity-80">Prompt:</span>
            <span className="font-mono text-base tabular-nums">#{promptCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}