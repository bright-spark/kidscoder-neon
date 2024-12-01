import { generateCode as openAIGenerate, getCodeSuggestions as openAISuggestions } from './openai';
import { generateCode as huggingFaceGenerate, getCodeSuggestions as huggingFaceSuggestions } from './huggingface';

function validateEnvironment() {
  const provider = import.meta.env.VITE_AI_PROVIDER?.toLowerCase() || 'openai';
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const huggingfaceKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;

  if (!openaiKey && !huggingfaceKey) {
    throw new Error('No API keys found. Please set either VITE_OPENAI_API_KEY or VITE_HUGGINGFACE_API_KEY in your .env file.');
  }

  if (provider === 'huggingface' && !huggingfaceKey) {
    console.warn('Hugging Face API key not found. Falling back to OpenAI.');
  }

  if (provider === 'openai' && !openaiKey) {
    console.warn('OpenAI API key not found. Falling back to Hugging Face.');
  }

  // Determine the actual provider based on available API keys
  if (provider === 'huggingface' && huggingfaceKey) {
    return { provider: 'huggingface' as const };
  }
  if (provider === 'openai' && openaiKey) {
    return { provider: 'openai' as const };
  }
  if (openaiKey) {
    return { provider: 'openai' as const };
  }
  if (huggingfaceKey) {
    return { provider: 'huggingface' as const };
  }
  
  throw new Error('No valid API configuration found. Please check your environment variables.');
}

const { provider } = validateEnvironment();

export const generateCode = provider === 'huggingface' ? huggingFaceGenerate : openAIGenerate;
export const getCodeSuggestions = provider === 'huggingface' ? huggingFaceSuggestions : openAISuggestions;