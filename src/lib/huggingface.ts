import axios from 'axios';

const API_TOKEN = import.meta.env.VITE_HUGGINGFACE_API_KEY;
// Using Mistral-7B model which is more suitable for the free tier
const MODEL_URL =
  'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2';

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
  signal?: AbortSignal,
  mode: 'debug' | 'improve' = 'debug'
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

    const modePrompt = mode === 'debug' ? debugPrompt : improvePrompt;

    const input = {
      inputs: `${systemPrompt}\n\n${modePrompt}\n\nConversation history:\n${conversationHistory}\n\nCurrent code:\n${code}\n\nHuman: ${prompt}\n\nAssistant:`,
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
