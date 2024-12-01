import { useEffect, useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ProcessingOverlayProps {
  isVisible: boolean;
  onCancel?: () => void;
}

export function ProcessingOverlay({ isVisible, onCancel }: ProcessingOverlayProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const { messages } = useChat();
  const [totalChars, setTotalChars] = useState(0);
  const userMessages = messages.filter(m => m.role === 'user');
  const promptCount = userMessages.length;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isVisible) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVisible]);

  useEffect(() => {
    const chars = messages
      .filter(msg => msg.role === 'assistant' && msg.content !== 'Generated code is ready in the editor')
      .reduce((acc, msg) => acc + msg.content.length, 0);
    setTotalChars(chars);
  }, [messages]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-purple-500/30 backdrop-blur-sm">
      <Card className="relative overflow-hidden border-none bg-white/10 p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-purple-500/20 to-transparent" />
        <div className="relative flex flex-col items-center space-y-6 text-white">
          <Loader2 className="h-12 w-12 animate-spin" />
          <div className="space-y-2 text-center">
            <p className="text-2xl font-semibold">
              {elapsedTime}s elapsed
            </p>
            {promptCount > 0 ? (
              <>
                <p className="text-sm text-white/80">
                  {promptCount === 1 ? '1 Prompt' : `${promptCount} Prompts`}
                </p>
                <p className="text-sm text-white/80">
                  {totalChars.toLocaleString()} characters generated
                </p>
              </>
            ) : (
              <p className="text-sm text-white/80">
                1 Prompt
              </p>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="mt-4 border border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Generation
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}