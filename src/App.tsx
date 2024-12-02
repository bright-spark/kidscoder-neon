import { Layout } from '@/components/Layout'
import { ChatProvider } from '@/contexts/ChatContext'
import { EditorProvider } from '@/contexts/EditorContext'
import { PreviewProvider } from '@/contexts/PreviewContext'
import { SessionProvider } from '@/contexts/SessionContext'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ToastProvider } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toast/Toaster'

export default function App() {
  return (
    <ToastProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SessionProvider>
          <ChatProvider>
            <EditorProvider>
              <PreviewProvider>
                <Layout />
              </PreviewProvider>
            </EditorProvider>
          </ChatProvider>
        </SessionProvider>
      </ThemeProvider>
      <Toaster />
    </ToastProvider>
  );
}