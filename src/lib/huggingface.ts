import axios from 'axios';

const API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_KEY;
// Using Mistral-7B model which is more suitable for the free tier
const MODEL_URL =
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

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
- Add comments for complex logic
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

async function handleHuggingFaceError(error: any): Promise<never> {
  let errorMessage = 'Failed to generate code. Please try again.';

  try {
    if (error?.name === 'AbortError') {
      throw new Error('Generation cancelled');
    }

    if (!error?.response) {
      throw new Error('Network error. Please check your connection.');
    }

    const status = error?.response?.status;
    const errorData = error?.response?.data;

    if (status === 401) {
      throw new Error(
        'Invalid API key. Please check your Hugging Face API key.'
      );
    }

    if (status === 400 && errorData?.error?.includes('loading')) {
      throw new Error(
        'Model is currently loading. Please try again in a few moments.'
      );
    }

    if (status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    if (status === 500) {
      throw new Error('Model service error. Please try again later.');
    }

    if (status === 503) {
      throw new Error(
        'Model is currently loading. Please try again in a few moments.'
      );
    }

    if (errorData?.error) {
      throw new Error(errorData.error);
    }

    throw new Error(errorMessage);
  } catch (e: any) {
    console.error('Hugging Face API Error:', {
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
  if (!API_TOKEN) {
    throw new Error('Hugging Face API key is not configured');
  }

  try {
    const conversationHistory = messages
      .map(
        (msg) =>
          `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      )
      .join('\n');

    const input = {
      inputs: `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nHuman: ${prompt}\n\nAssistant:`,
      parameters: {
        max_new_tokens: 4096,
        temperature: 0.7,
        top_p: 0.95,
        top_k: 50,
        repetition_penalty: 1.15,
        return_full_text: false,
        wait_for_model: true,
        use_cache: true,
      },
    };

    const response = await axios.post(MODEL_URL, input, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal,
      timeout: 120000, // 2 minute timeout
    });

    const generatedText = response.data[0]?.generated_text;
    if (!generatedText) {
      throw new Error('No response received from AI. Please try again.');
    }

    return trimCodeDelimiters(generatedText);
  } catch (error: any) {
    return handleHuggingFaceError(error);
  }
}

export async function getCodeSuggestions(
  code: string,
  prompt: string,
  messages: Array<{ role: string; content: string }> = [],
  signal?: AbortSignal
): Promise<string> {
  if (!API_TOKEN) {
    throw new Error('Hugging Face API key is not configured');
  }

  try {
    const conversationHistory = messages
      .map(
        (msg) =>
          `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      )
      .join('\n');

    const input = {
      inputs: `${systemPrompt}\n\nConversation history:\n${conversationHistory}\n\nCurrent code:\n${code}\n\nHuman: ${prompt}\n\nAssistant:`,
      parameters: {
        max_new_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
        top_k: 50,
        repetition_penalty: 1.15,
        return_full_text: false,
        wait_for_model: true,
        use_cache: true,
      },
    };

    const response = await axios.post(MODEL_URL, input, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      signal,
      timeout: 120000, // 2 minute timeout
    });

    const suggestions = response.data[0]?.generated_text;
    if (!suggestions) {
      throw new Error('No suggestions received from AI. Please try again.');
    }

    return trimCodeDelimiters(suggestions);
  } catch (error: any) {
    return handleHuggingFaceError(error);
  }
}
