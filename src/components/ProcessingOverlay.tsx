import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cancelOpenAIRequest } from '@/lib/openai';
import { useChat } from '@/contexts/ChatContext';

interface ProcessingOverlayProps {
  isVisible: boolean;
  onCancel?: () => void;
}

export function ProcessingOverlay({ isVisible, onCancel }: ProcessingOverlayProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const { clearLastMessage } = useChat();

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await cancelOpenAIRequest();
      clearLastMessage();
      onCancel?.();
    } finally {
      setIsCancelling(false);
    }
  };

  useEffect(() => {
    if (!isVisible) {
      setIsCancelling(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 p-6 rounded-lg bg-background border shadow-lg">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Processing...</span>
        </div>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isCancelling}
        >
          {isCancelling ? 'Cancelling...' : 'Cancel'}
        </Button>
      </div>
    </div>
  );
}