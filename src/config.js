/**
 * StudySnap — App Configuration
 * 
 * Reads environment variables injected by Vite at build/dev time.
 * 🔐 Set your API key in the `.env` file at the project root (not here).
 *    See .env.example for the required format.
 */

const CONFIG = {
  // OpenAI settings — set via .env file at project root
  API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
  MODEL: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
  
  // Feature flags
  AI_PROVIDER: 'openai',
}

export default CONFIG