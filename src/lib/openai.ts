import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { showToast } from '@/lib/toast';
import { aiCache } from '@/lib/aiCache';

// Create a singleton AbortController instance
let currentController: AbortController | null = null;

function getOpenAIClient() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your .env file.');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
}

const openai = getOpenAIClient();

const systemPrompt = `You are a specialized web development AI focused on generating single-file web applications. Follow these instructions precisely:

RESPONSE FORMAT:
1. Generate ONLY a complete, self-contained HTML file
2. Include ALL CSS in a single <style> tag
3. Include ALL JavaScript in a single <script> tag
4. NO markdown code blocks, NO explanations
5. ONLY output valid HTML code

CORE REQUIREMENTS:
1. Structure:
   - Valid HTML5 DOCTYPE and meta tags
   - Viewport and charset declarations
   - SEO meta tags
   - Single file structure

2. Dependencies (CDN only):
   - Tailwind CSS 2.2.19: https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css
   - NO other external CSS/JS files

3. Performance Optimization:
   - Minified inline CSS/JS
   - Efficient DOM operations
   - Event delegation
   - Debounced event handlers
   - Lazy loading for images

4. Error Handling:
   - Try-catch blocks
   - Fallback states
   - Console error logging
   - User feedback messages

DESIGN SYSTEM:
1. Theme:
   - Purple-based glassmorphic UI
   - Consistent color palette
   - Modern, clean aesthetics

2. Components:
   - Responsive layout
   - Interactive elements
   - Loading states
   - Smooth transitions
   - Proper spacing

3. Accessibility:
   - ARIA labels
   - Semantic HTML
   - Keyboard navigation
   - Focus management
   - Color contrast

CONSTRAINTS:
1. Single file output
2. No external resources except Tailwind
3. Cross-browser compatibility
4. Mobile-first design
5. Performance-optimized code

QUALITY CHECKS:
1. Valid HTML structure
2. Working interactivity
3. Error-free console
4. Responsive layout
5. Accessible interface`;

function trimCodeDelimiters(code: string): string {
  return code
    .replace(/^```[\w-]*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .replace(/^```\n?/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/`/g, '')
    .trim();
}

export function cancelOpenAIRequest() {
  if (currentController) {
    currentController.abort();
    currentController = null;
    showToast.system({
      title: 'Cancelled',
      description: 'Generation cancelled successfully',
      duration: 2000
    });
  }
}

// Utility function to combine multiple abort signals into one
function createCombinedSignal(signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  
  // Filter out undefined signals
  const validSignals = signals.filter((signal): signal is AbortSignal => signal !== undefined);
  
  if (validSignals.length === 0) {
    return controller.signal;
  }

  // Check if any signal is already aborted
  if (validSignals.some(signal => signal.aborted)) {
    controller.abort();
    return controller.signal;
  }

  // Listen to all signals
  validSignals.forEach(signal => {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  });

  return controller.signal;
}

export async function generateCode(
  prompt: string,
  messages: ChatCompletionMessageParam[] = [],
  signal?: AbortSignal
): Promise<string> {
  try {
    // Check cache first
    const fullMessages = [
      { role: 'system', content: systemPrompt } as ChatCompletionMessageParam,
      ...messages,
      { role: 'user', content: prompt } as ChatCompletionMessageParam
    ];
    const cachedResponse = await aiCache.get(fullMessages);
    if (cachedResponse) {
      return trimCodeDelimiters(cachedResponse);
    }

    // Cancel any existing request
    if (currentController) {
      currentController.abort();
    }

    // Create new controller for this request
    currentController = new AbortController();

    // Combine the external signal with our internal controller
    const combinedSignal = createCombinedSignal([signal]);

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      showToast.error({
        title: 'Configuration Error',
        description: 'OpenAI API key is not configured',
        duration: 5000
      });
      throw new Error('OpenAI API key is not configured');
    }

    showToast.system({
      title: 'Generating Code',
      description: 'Please wait while we generate your code...',
      duration: 3000
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 4096,
      messages: fullMessages,
      stream: true
    }, { signal: combinedSignal });

    let fullResponse = '';
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
    }

    if (!fullResponse) {
      throw new Error('No response received from AI. Please try again.');
    }

    const trimmedCode = trimCodeDelimiters(fullResponse);
    // Cache the successful response with full messages for context
    aiCache.set(fullMessages, fullResponse);
    
    return trimmedCode;
  } catch (error: any) {
    // Clear the controller on error
    currentController = null;
    if (error.name === 'AbortError') {
      showToast.error({
        title: 'Cancelled',
        description: 'Request cancelled',
        duration: 2000
      });
      throw error;
    }
    
    if (error.status === 429) {
      showToast.error({
        title: 'Rate Limit',
        description: 'Rate limit exceeded. Please try again in a moment.',
        duration: 5000
      });
    } else {
      showToast.error({
        title: 'Error',
        description: 'Failed to get code suggestions. Please try again.',
        duration: 5000
      });
    }
    
    throw error;
  } finally {
    if (currentController) {
      currentController = null;
    }
  }
}

export async function getCodeSuggestions(
  messages: ChatCompletionMessageParam[],
  signal?: AbortSignal
): Promise<string> {
  try {
    // Check cache first
    const cachedResponse = await aiCache.get(messages);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Cancel any existing request
    if (currentController) {
      currentController.abort();
    }

    // Create new controller for this request
    currentController = new AbortController();

    // Combine the external signal with our internal controller
    const combinedSignal = createCombinedSignal([signal]);

    if (!import.meta.env.VITE_OPENAI_API_KEY) {
      showToast.error({
        title: 'Configuration Error',
        description: 'OpenAI API key is not configured',
        duration: 5000
      });
      throw new Error('OpenAI API key is not configured');
    }

    showToast.system({
      title: 'Generating Suggestions',
      description: 'Please wait while we analyze your code...',
      duration: 3000
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true
    }, { signal: combinedSignal });

    let fullResponse = '';
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
    }

    if (!fullResponse) {
      throw new Error('No suggestions received from AI. Please try again.');
    }

    // Cache the successful response
    aiCache.set(messages, fullResponse);
    
    return fullResponse;
  } catch (error: any) {
    // Clear the controller on error
    currentController = null;
    if (error.name === 'AbortError') {
      showToast.error({
        title: 'Cancelled',
        description: 'Request cancelled',
        duration: 2000
      });
      throw error;
    }
    
    if (error.status === 429) {
      showToast.error({
        title: 'Rate Limit',
        description: 'Rate limit exceeded. Please try again in a moment.',
        duration: 5000
      });
    } else {
      showToast.error({
        title: 'Error',
        description: 'Failed to get code suggestions. Please try again.',
        duration: 5000
      });
    }
    
    throw error;
  } finally {
    if (currentController) {
      currentController = null;
    }
  }
}