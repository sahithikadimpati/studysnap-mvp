import OpenAI from 'openai';
import CONFIG from './config';

// Initialize the OpenAI client
// Note: dangerouslyAllowBrowser: true is required for client-side API calls
const openai = new OpenAI({
  apiKey: CONFIG.API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Generate study material using OpenAI GPT-4o-mini
 * @param {string} text - The input notes/text from the student
 * @returns {Promise<Object>} Structured study material matching mockData.js
 */
export const generateStudyMaterial = async (text) => {
  if (!CONFIG.API_KEY) {
    throw new Error('API_KEY_MISSING');
  }

  try {
    // 1. Summary Prompt
    const summaryPromise = openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        { 
          role: 'system', 
          content: "Summarize the following text into 3-4 key revision points and a one-liner. Return as JSON with 'keyPoints' (array of strings) and 'oneLiner' (string)." 
        },
        { role: 'user', content: text }
      ],
      response_format: { type: "json_object" }
    });

    // 2. Explanation Prompt
    const explainPromise = openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        { 
          role: 'system', 
          content: "Explain this topic simply with an analogy and step-by-step breakdown. Return JSON with 'simpleExplanation' (string), 'analogy' (string), and 'breakdown' (array of strings)." 
        },
        { role: 'user', content: text }
      ],
      response_format: { type: "json_object" }
    });

    // 3. Questions Prompt
    const questionsPromise = openai.chat.completions.create({
      model: CONFIG.MODEL,
      messages: [
        { 
          role: 'system', 
          content: "Generate 4 important exam questions with difficulty levels and 2 MCQs. Return JSON with 'importantQuestions' (array of {q, difficulty}) and 'mcqs' (array of {question, options, correct (index)})." 
        },
        { role: 'user', content: text }
      ],
      response_format: { type: "json_object" }
    });

    // Run all requests in parallel for speed
    const [summaryRes, explainRes, questionsRes] = await Promise.all([
      summaryPromise,
      explainPromise,
      questionsPromise
    ]);

    // Extract and parse JSON from responses
    const summary = JSON.parse(summaryRes.choices[0].message.content);
    const explanation = JSON.parse(explainRes.choices[0].message.content);
    const questions = JSON.parse(questionsRes.choices[0].message.content);

    return {
      summary,
      explanation,
      questions
    };
  } catch (error) {
    console.error('StudySnap AI API Error:', error);
    // Pass the specific error up
    if (error.status === 401) throw new Error('INVALID_API_KEY');
    if (error.status === 429) throw new Error('RATE_LIMIT_EXCEEDED');
    throw new Error('AI_API_FAILED');
  }
};
