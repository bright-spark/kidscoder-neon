import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { showToast } from '@/lib/toast';
import { aiCache } from '@/lib/aiCache';

// Create a singleton AbortController instance
let currentController: AbortController | null = null;

function createCombinedSignal(signals: (AbortSignal | undefined)[]): AbortSignal {
  const controller = new AbortController();
  
  // Filter out undefined signals and ensure they are valid AbortSignals
  const validSignals = signals.filter((signal): signal is AbortSignal => {
    if (!signal) return false;
    return signal instanceof AbortSignal || (
      typeof signal === 'object' && 
      signal !== null && 
      'aborted' in signal && 
      typeof (signal as { aborted: unknown }).aborted === 'boolean'
    );
  });

  validSignals.forEach(signal => {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', () => controller.abort());
    }
  });

  return controller.signal;
}

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

const systemPrompt = `You are a specialized kid-friendly web development AI focused on generating safe, educational single-file web applications. Follow these instructions precisely:

OUTPUT FORMAT:
1. Always return a complete, self-contained HTML file
2. Include all CSS in a <style> tag in the head
3. Include all JavaScript in a <script> tag at the end of body
4. Do not include any explanations or summaries outside the HTML
5. Use proper HTML5 doctype and meta tags

COMMENT STYLE:
1. Code Comments:
   /* INFO: Brief explanation of what the code does */
   /* NOTE: Important implementation details */
   /* WARN: Safety considerations or limitations */

SAFETY RULES:
1. No external resources (scripts, styles, images)
2. No backend or server requirements
3. Keep code kid-friendly and educational
4. Use simple, clear variable names
5. Include basic error handling

Example Structure:
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Kid's Coding Project</title>
    <style>
        /* INFO: Main styles */
    </style>
</head>
<body>
    <!-- Main content -->
    <script>
        /* INFO: Main logic */
    </script>
</body>
</html>`;

const debugPrompt = `Analyze the code and return a complete, fixed version. Follow these rules:
1. Return ONLY the complete HTML file with embedded CSS and JS
2. Fix any errors or bugs found
3. Add /* FIX: description */ comments before each fix
4. Keep all working code unchanged
5. Maintain the single-file structure`;

const improvePrompt = `Improve the code while maintaining its core functionality. Follow these rules:
1. Return ONLY the complete HTML file with embedded CSS and JS
2. Add /* UPDATE: description */ comments for improvements
3. Focus on code efficiency and best practices
4. Keep the code kid-friendly and educational
5. Maintain the single-file structure`;

function trimCodeDelimiters(code: string): string {
  return code
    .replace(/^```[\w-]*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .replace(/^```\n?/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/`/g, '')
    .trim();
}

// Comment type definition
type CommentType = 'INFO' | 'FIX' | 'UPDATE' | 'WARN' | 'NOTE';

function extractComments(code: string, type: CommentType): string[] {
  const commentRegex = new RegExp(`\\/\\*\\s*${type}:\\s*([^*]+)\\*\\/`, 'g');
  const matches = Array.from(code.matchAll(commentRegex));
  return matches.map(match => match[1].trim());
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

// List of forbidden terms and patterns for kid safety
const FORBIDDEN_PATTERNS = [
  // Harmful content
  /\b(hack|exploit|crack|steal|damage)\b/i,
  // Inappropriate content
  /\b(adult|nsfw|gambling|betting)\b/i,
  // Dangerous operations
  /\b(delete|remove|drop|truncate)\b/i,
  // Sensitive data
  /\b(password|credit.?card|ssn|social.?security)\b/i,
  // Cryptocurrency
  /\b(crypto|bitcoin|ethereum|nft)\b/i,
  // Dangerous code patterns
  /\b(eval|function\(|new Function)\b/i,
  // Database operations
  /\b(sql|database|select|insert|update)\b/i,
  // Network operations
  /\b(fetch|xhr|ajax)\b/i,
  // Storage operations
  /\b(localStorage|sessionStorage|indexedDB)\b/i,
];

// List of educational keywords to ensure learning focus
const EDUCATIONAL_KEYWORDS = [
  'learn', 'practice', 'teach', 'explain', 'help',
  'create', 'build', 'make', 'design', 'develop',
  'game', 'animation', 'story', 'quiz', 'puzzle',
  'math', 'science', 'art', 'music', 'code'
];

function checkContentSafety(prompt: string): { safe: boolean; reason?: string } {
  // Convert to lowercase for case-insensitive checking
  const lowerPrompt = prompt.toLowerCase();

  // Check for forbidden patterns
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(lowerPrompt)) {
      return {
        safe: false,
        reason: `I can't help with that. Let's focus on fun learning projects instead! 🌟`
      };
    }
  }

  // Check for educational focus
  const hasEducationalFocus = EDUCATIONAL_KEYWORDS.some(keyword => 
    lowerPrompt.includes(keyword.toLowerCase())
  );

  if (!hasEducationalFocus) {
    return {
      safe: false,
      reason: `Let's make something fun and educational! Try asking about creating games, animations, or other learning projects! 🎨`
    };
  }

  return { safe: true };
}

export async function generateCode(
  prompt: string,
  messages: ChatCompletionMessageParam[] = [],
  signal?: AbortSignal,
  currentCode?: string
): Promise<string> {
  const safetyCheck = checkContentSafety(prompt);
  if (!safetyCheck.safe) {
    throw new Error(`Safety check failed: ${safetyCheck.reason}`);
  }

  try {
    // Check cache first
    const fullMessages = [
      { 
        role: 'system', 
        content: systemPrompt + (currentCode ? `\n\nCURRENT CODE:\n${currentCode}\n\nModify, expand, or use this code as reference while following the above rules.` : '')
      } as ChatCompletionMessageParam,
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
    const combinedSignal = signal 
      ? createCombinedSignal([signal, currentController.signal])
      : currentController.signal;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true
    }, { signal: combinedSignal });

    let code = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      code += content;
    }

    // Extract comments and cache the response
    const comments = extractComments(code, 'INFO');
    if (comments.length > 0) {
      const commentMessage: ChatCompletionMessageParam = {
        role: 'assistant',
        content: comments.join('\n')
      };
      messages.push(commentMessage);
    }

    // Cache the successful response
    await aiCache.set(fullMessages, code);

    return trimCodeDelimiters(code);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error(`Failed to generate code: ${error.message}`);
  } finally {
    if (currentController) {
      currentController = null;
    }
  }
}

export async function getCodeSuggestions(
  messages: ChatCompletionMessageParam[],
  signal?: AbortSignal,
  mode: 'debug' | 'improve' = 'debug',
  currentCode?: string
): Promise<string> {
  try {
    const modePrompt = mode === 'debug' ? debugPrompt : improvePrompt;
    const systemMessage = {
      role: 'system' as const,
      content: modePrompt + (currentCode ? `\n\nCURRENT CODE:\n${currentCode}\n\nAnalyze and ${mode} this code while following the above rules.` : '')
    };

    // Check cache first
    const fullMessages = [systemMessage, ...messages];
    const cachedResponse = await aiCache.get(fullMessages);
    if (cachedResponse) {
      return trimCodeDelimiters(cachedResponse);
    }

    // Create combined signal
    const combinedSignal = signal 
      ? createCombinedSignal([signal])
      : undefined;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 4000,
      stream: true
    }, { signal: combinedSignal });

    let code = '';
    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || '';
      code += content;
    }

    // Extract comments based on mode
    const commentType = mode === 'debug' ? 'FIX' : 'UPDATE';
    const comments = extractComments(code, commentType as CommentType);
    if (comments.length > 0) {
      const commentMessage: ChatCompletionMessageParam = {
        role: 'assistant',
        content: comments.join('\n')
      };
      messages.push(commentMessage);
    }

    // Cache the successful response
    await aiCache.set(fullMessages, code);

    return trimCodeDelimiters(code);
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw error;
    }
    throw new Error(`Failed to get code suggestions: ${error.message}`);
  }
}