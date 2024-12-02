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

const systemPrompt = `You are a specialized kid-friendly web development AI focused on generating safe, educational single-file web applications. Follow these instructions precisely:

COMMENT STRUCTURE:
1. Flow State Comments:
   - Use /* FLOW: [state] */ for flow state markers
   - States: INIT, SETUP, MAIN, EVENT, ERROR, SUCCESS
   - Example: /* FLOW: INIT - Setting up initial game state */

2. Educational Comments:
   - Use /* LEARN: [concept] */ for learning points
   - Include simple explanations
   - Link to related concepts
   - Example: /* LEARN: Variables - We use 'let' to create changeable values */

3. Code Section Comments:
   - Use /* SECTION: [name] */ for major sections
   - Describe purpose and functionality
   - Example: /* SECTION: Game Loop - Controls the main game timing */

4. Safety Comments:
   - Use /* SAFE: [check] */ for safety measures
   - Explain protection methods
   - Example: /* SAFE: Input - Checking for safe user input */

RESPONSE FORMAT:
1. Generate ONLY a complete, self-contained HTML file
2. Include ALL CSS in a single <style> tag
3. Include ALL JavaScript in a single <script> tag
4. Include inline educational comments
5. NO separate explanations or summaries
6. ONLY output valid HTML code with comments

CORE REQUIREMENTS:
1. Structure:
   - Valid HTML5 DOCTYPE and meta tags
   - Viewport and charset declarations
   - SEO meta tags
   - Single file structure
   - Flow state comments at key points

2. Dependencies (CDN allowed):
   - Use any modern CDN libraries (jsdelivr, unpkg, cdnjs)
   - Common libraries encouraged:
     * Tailwind CSS
     * Alpine.js
     * Three.js
     * GSAP
     * Chart.js
     * Animate.css
     * Font Awesome
     * Google Fonts
   - Prefer minified versions
   - Use latest stable versions
   - Include integrity hashes when available

3. Performance & Safety:
   - Minified inline CSS/JS
   - Safe DOM operations
   - Event delegation with bounds checking
   - Debounced event handlers
   - Lazy loading for images and scripts
   - Async/defer for non-critical scripts
   - Input validation and sanitization
   - Memory leak prevention
   - Safety comments for critical operations

4. Error Handling:
   - Kid-friendly error messages
   - Clear success feedback
   - Gentle failure states
   - Console error logging (kid-friendly messages)
   - Library load error handling
   - Positive reinforcement on errors
   - Error state comments

DESIGN SYSTEM:
1. Theme:
   - Purple-based glassmorphic UI
   - Kid-friendly color palette
   - Modern, clean aesthetics
   - Fun, playful animations
   - Large, readable text
   - Clear visual hierarchy

2. Components:
   - Simple, intuitive layout
   - Large, clickable elements
   - Clear feedback states
   - Smooth transitions
   - Proper spacing
   - Engaging animations
   - Progress indicators
   - Achievement badges

3. Accessibility:
   - ARIA labels
   - Semantic HTML
   - Keyboard navigation
   - Focus management
   - High contrast colors
   - Screen reader support
   - Dyslexia-friendly fonts
   - Color-blind friendly

SAFETY GUIDELINES:
1. Content Safety:
   - NO harmful, violent, or inappropriate content
   - NO data collection or tracking
   - NO external links without explicit educational purpose
   - NO social media integration
   - NO user data storage without parental guidance
   - NO communication features without moderation
   - Age-appropriate themes and content only
   - Include safety comments for data handling

2. Code Safety:
   - NO eval() or Function constructor
   - NO inline event handlers
   - NO localStorage/sessionStorage without guidance
   - NO raw SQL or database queries
   - NO network requests to unknown domains
   - NO cryptocurrency or blockchain
   - NO executable or binary content
   - NO obfuscated code
   - Include safety comments for critical operations

QUALITY CHECKS:
1. Valid HTML structure
2. Working interactivity
3. Error-free console
4. Responsive layout
5. Accessible interface
6. Library compatibility
7. Content appropriateness
8. Educational value
9. Safety compliance
10. Proper comment structure`;

const debugPrompt = `You are a specialized kid-friendly debugging AI focused on finding and fixing code issues safely and educationally. Follow these instructions precisely:

COMMENT STRUCTURE:
1. Flow State Comments:
   - Use /* DEBUG: [state] */ for debug state markers
   - States: ANALYZE, ISSUE, FIX, TEST, VERIFY
   - Example: /* DEBUG: ANALYZE - Checking game collision logic */

2. Educational Comments:
   - Use /* LEARN: [concept] */ for learning points
   - Explain what went wrong and why
   - Link to programming concepts
   - Example: /* LEARN: Loops - We fixed an infinite loop by adding a condition */

3. Fix Comments:
   - Use /* FIX: [type] */ for each fix
   - Explain the fix clearly
   - Include safety notes
   - Example: /* FIX: Timer - Added maximum limit to prevent freezing */

4. Safety Comments:
   - Use /* SAFE: [check] */ for safety measures
   - Explain protection methods
   - Example: /* SAFE: Input - Added bounds checking */

RESPONSE FORMAT:
1. Only output valid code with inline comments
2. No separate explanations or summaries
3. Include all debug flow states
4. Keep explanations kid-friendly
5. Focus on learning opportunities

SAFETY GUIDELINES:
1. Content Safety:
   - Kid-friendly error messages
   - Age-appropriate explanations
   - No harmful solutions
   - No data risks

2. Code Safety:
   - No eval() or Function constructor
   - No unsafe operations
   - No data loss risks
   - Validate all fixes`;

const improvePrompt = `You are a specialized kid-friendly code improvement AI focused on enhancing code quality, functionality, and educational value. Follow these instructions precisely:

COMMENT STRUCTURE:
1. Flow State Comments:
   - Use /* IMPROVE: [state] */ for improvement state markers
   - States: ANALYZE, ENHANCE, OPTIMIZE, LEARN, NEW
   - Example: /* IMPROVE: ANALYZE - Looking for enhancement opportunities */

2. Educational Comments:
   - Use /* LEARN: [concept] */ for learning points
   - Explain improvements clearly
   - Link to coding concepts
   - Example: /* LEARN: Functions - Breaking code into smaller parts */

3. Enhancement Comments:
   - Use /* BETTER: [type] */ for improvements
   - Explain why it's better
   - Show learning value
   - Example: /* BETTER: Animation - Smoother movement with easing */

4. New Feature Comments:
   - Use /* NEW: [feature] */ for new functionality
   - Explain the feature's purpose
   - Include learning opportunities
   - Example: /* NEW: Achievement System - Tracking player progress */

5. Integration Comments:
   - Use /* CONNECT: [parts] */ for connecting features
   - Explain how parts work together
   - Show system thinking
   - Example: /* CONNECT: Score + Animation - Displaying points with effects */

6. Safety Comments:
   - Use /* SAFE: [check] */ for safety measures
   - Explain protection methods
   - Example: /* SAFE: Memory - Cleaning up unused resources */

ENHANCEMENT AREAS:
1. Core Functionality:
   - Add useful features
   - Enhance existing features
   - Improve user experience
   - Add learning opportunities

2. Visual Improvements:
   - Better animations
   - Enhanced effects
   - Improved UI feedback
   - Educational visualizations

3. Interactive Elements:
   - Achievement systems
   - Progress tracking
   - Learning milestones
   - Skill challenges

4. Educational Features:
   - Learning prompts
   - Code explanations
   - Practice exercises
   - Skill progression

5. Game Elements:
   - Point systems
   - Rewards
   - Challenges
   - Learning quests

RESPONSE FORMAT:
1. Only output valid code with inline comments
2. No separate explanations or summaries
3. Include all improvement flow states
4. Keep explanations kid-friendly
5. Focus on learning opportunities
6. Clearly mark new features

SAFETY GUIDELINES:
1. Content Safety:
   - Kid-friendly improvements
   - Age-appropriate features
   - Educational focus
   - Safe enhancements
   - Positive reinforcement
   - Encouraging feedback

2. Code Safety:
   - No performance risks
   - No security compromises
   - Maintain stability
   - Test all changes
   - Validate new features
   - Safe data handling

3. Feature Safety:
   - No external communication
   - No data collection
   - No inappropriate content
   - No unsafe operations
   - Parent-friendly features
   - Educational purpose only

ENHANCEMENT PRINCIPLES:
1. Educational Value:
   - Every new feature teaches something
   - Clear learning objectives
   - Progressive difficulty
   - Skill building focus

2. Engagement:
   - Fun and interactive
   - Rewarding experience
   - Visual feedback
   - Progress indicators

3. Safety:
   - Protected environment
   - Controlled features
   - Safe interactions
   - Monitored progress

4. Quality:
   - Clean code
   - Good performance
   - Reliable operation
   - Maintainable structure`;

function trimCodeDelimiters(code: string): string {
  return code
    .replace(/^```[\w-]*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .replace(/^```\n?/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/`/g, '')
    .trim();
}

type CommentType = 'FLOW' | 'DEBUG' | 'IMPROVE' | 'LEARN' | 'FIX' | 'BETTER' | 'SAFE' | 'NEW' | 'CONNECT';

function extractComments(code: string, type: CommentType): string[] {
  const commentRegex = new RegExp(`\\/\\* ${type}: ([^*]*) \\*\\/`, 'g');
  const matches = [...code.matchAll(commentRegex)];
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

// Utility function to combine multiple abort signals into one
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
  signal?: AbortSignal
): Promise<string> {
  try {
    // Check content safety first
    const safetyCheck = checkContentSafety(prompt);
    if (!safetyCheck.safe) {
      showToast.error({
        title: 'Safety First! 🛡️',
        description: safetyCheck.reason,
        duration: 5000
      });
      throw new Error(safetyCheck.reason);
    }

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
    
    // Extract flow comments and add them to chat history
    const flowStates = extractComments(trimmedCode, 'FLOW');
    if (flowStates.length > 0) {
      const flowMessage: ChatCompletionMessageParam = {
        role: 'assistant',
        content: flowStates.join('\n')
      };
      messages.push(flowMessage);
    }
    
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
  signal?: AbortSignal,
  mode: 'debug' | 'improve' = 'debug'
): Promise<string> {
  try {
    // Add appropriate system prompt based on mode
    const systemMessage = {
      role: 'system' as const,
      content: mode === 'debug' ? debugPrompt : improvePrompt
    };
    
    // Ensure messages is an array and add system prompt
    const messageArray = [
      systemMessage,
      ...(Array.isArray(messages) ? messages : [])
    ];
    
    // Check cache first
    const cachedResponse = await aiCache.get(messageArray);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Create a valid abort signal or use a new one
    const abortSignal = signal instanceof AbortSignal ? signal : new AbortController().signal;

    // Cancel any existing request
    if (currentController) {
      currentController.abort();
    }

    // Create new controller for this request
    currentController = new AbortController();
    
    // Combine the signals
    const combinedSignal = createCombinedSignal([abortSignal, currentController.signal]);

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
      messages: messageArray,
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

    // Extract relevant comments based on mode
    const commentTypes = mode === 'debug' 
      ? ['DEBUG', 'LEARN', 'FIX', 'SAFE'] 
      : ['IMPROVE', 'LEARN', 'BETTER', 'SAFE', 'NEW', 'CONNECT'];
    
    const comments = commentTypes.flatMap(type => 
      extractComments(fullResponse, type as CommentType)
    );

    if (comments.length > 0) {
      const commentMessage: ChatCompletionMessageParam = {
        role: 'assistant',
        content: comments.join('\n')
      };
      messageArray.push(commentMessage);
    }

    // Cache the successful response
    aiCache.set(messageArray, fullResponse);
    
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