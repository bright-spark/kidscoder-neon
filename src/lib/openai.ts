import OpenAI from 'openai';
import { showToast } from '@/lib/toast';

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

const systemPrompt = `You are an expert web developer specializing in creating modern, interactive web applications. Your responses should strictly follow these guidelines:

Output Format:
- Provide complete, self-contained HTML files only
- Include all CSS and JavaScript within the file
- Never include code block markers or explanations
- Return only the actual code

Technical Requirements:
- Use Tailwind CSS v2.2.19 for styling (CDN: https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css)
- Implement responsive design for all screen sizes
- Add proper meta tags for SEO and social sharing
- Include error handling and console logging
- Ensure cross-browser compatibility
- Follow web accessibility guidelines
- Optimize for performance

Design Guidelines:
- Create modern, professional UI designs
- Use a purple-based glassmorphic theme
- Implement smooth animations and transitions
- Ensure visual hierarchy and proper spacing
- Use consistent color schemes and typography
- Add hover and focus states for interactive elements
- Include loading states and feedback for user actions

Image Requirements:
- Use high-quality Unsplash images
- Include proper alt text for accessibility
- Optimize images for performance
- Use responsive image techniques
- Implement lazy loading where appropriate

Meta Tags:
- Include viewport meta tag
- Add proper Open Graph tags for social sharing
- Include Twitter Card meta tags
- Add theme-color meta tag
- Include proper favicon and app icons
- Add web app manifest for PWA support

Best Practices:
- Write semantic HTML
- Use proper ARIA attributes
- Implement proper form validation
- Add keyboard navigation support
- Include proper error states
- Use meaningful variable and function names
- Add code comments for complex logic
- Implement proper event handling
- Use ES6+ JavaScript features
- Add proper security measures

Remember: Return only the complete, working code without any explanations or markdown formatting.`;

function trimCodeDelimiters(code: string): string {
  return code
    .replace(/^```[\w-]*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .replace(/^```\n?/gm, '')
    .replace(/`{1,3}/g, '')
    .replace(/`/g, '')
    .trim();
}

async function handleOpenAIError(error: any): Promise<never> {
  let errorMessage = 'Failed to generate code. Please try again.';

  try {
    if (error?.name === 'AbortError') {
      throw new Error('Generation cancelled');
    }

    // Network or connection errors
    if (!error?.response) {
      throw new Error('Network error. Please check your connection.');
    }

    // OpenAI API errors
    const status = error?.response?.status;
    const errorData = error?.response?.data;

    if (status === 401) {
      throw new Error('Invalid API key. Please check your OpenAI API key.');
    }

    if (status === 429) {
      const retryAfter = error?.response?.headers?.['retry-after'];
      throw new Error(
        retryAfter
          ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
          : 'Rate limit exceeded. Please try again later.'
      );
    }

    if (status === 500) {
      throw new Error('OpenAI service error. Please try again later.');
    }

    if (status === 503) {
      throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
    }

    // Handle specific OpenAI error types
    if (errorData?.error?.type === 'invalid_request_error') {
      errorMessage = 'Invalid request. Please try a different prompt.';
    } else if (errorData?.error?.type === 'context_length_exceeded') {
      errorMessage = 'The prompt is too long. Please try a shorter prompt.';
    } else if (errorData?.error?.message) {
      errorMessage = errorData.error.message;
    }

    throw new Error(errorMessage);
  } catch (e: any) {
    console.error('OpenAI API Error:', {
      name: error?.name,
      status: error?.response?.status,
      data: error?.response?.data,
      message: e.message,
    });
    throw new Error(e.message || errorMessage);
  }
}

export async function generateCode(
  prompt: string,
  messages: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        { role: 'user', content: prompt },
      ],
    }, { 
      abortSignal: signal
    });

    const code = response.choices[0]?.message?.content;
    if (!code) {
      throw new Error('No response received from AI. Please try again.');
    }

    return trimCodeDelimiters(code);
  } catch (error: any) {
    return handleOpenAIError(error);
  }
}

export async function getCodeSuggestions(
  code: string,
  prompt: string,
  messages: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured');
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
        {
          role: 'user',
          content: `Current code:\n${code}\n\nPrompt: ${prompt}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      stream: false,
    }, { 
      signal,
      abort: (controller) => {
        controller.abort();
        throw new Error('Generation cancelled');
      }
    });

    const suggestions = response.choices[0]?.message?.content;
    if (!suggestions) {
      throw new Error('No suggestions received from AI. Please try again.');
    }

    return trimCodeDelimiters(suggestions);
  } catch (error: any) {
    return handleOpenAIError(error);
  }
}