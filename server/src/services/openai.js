const { OpenAI } = require('openai');

// Initialize OpenAI client lazily so we don't crash on startup if key is missing
let openaiInstance = null;

function getOpenAIClient() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      const err = new Error('OpenAI API key is missing. Please configure OPENAI_API_KEY in your .env file.');
      err.status = 401;
      throw err;
    }
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

/**
 * Handle OpenAI errors and map to standardized HTTP status codes
 */
function handleOpenAIError(error) {
  console.error('OpenAI Service Error:', error);
  const status = error.status || error.statusCode || 500;
  
  const err = new Error(error.message || 'Error communicating with OpenAI');
  err.status = status;
  return err;
}

/**
 * Generates study material using OpenAI API by making 3 concurrent requests
 * for summary, explanation, and questions.
 */
async function generateStudyMaterial(text) {
  const openai = getOpenAIClient();
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const summarySystemPrompt = 'You are an educational assistant that summarizes study materials into clear key points and a brief one-liner.';
  const summaryUserPrompt = `Analyze the following text and provide a summary.
Your response MUST be a JSON object with this exact structure:
{
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3"
  ],
  "oneLiner": "A single sentence summary"
}
Ensure the JSON is perfectly valid. Do not wrap with markdown or extra text.
Text to analyze:
${text}`;

  const explanationSystemPrompt = 'You are a teaching assistant that simplifies complex concepts with analogies and clear breakdowns.';
  const explanationUserPrompt = `Explain the following text in simple terms suitable for a college student.
Your response MUST be a JSON object with this exact structure:
{
  "simpleExplanation": "Clear, plain explanation here...",
  "analogy": "An analogy that makes this easy to understand...",
  "breakdown": [
    "Step/concept 1",
    "Step/concept 2",
    "Step/concept 3"
  ]
}
Ensure the JSON is perfectly valid. Do not wrap with markdown or extra text.
Text to analyze:
${text}`;

  const questionsSystemPrompt = 'You are an exam examiner that generates high-quality study questions and MCQs.';
  const questionsUserPrompt = `Generate important study/exam questions (Easy, Medium, Hard) and multiple-choice questions (MCQs) from the following text.
Your response MUST be a JSON object with this exact structure:
{
  "importantQuestions": [
    { "q": "Question 1", "difficulty": "Easy" },
    { "q": "Question 2", "difficulty": "Medium" },
    { "q": "Question 3", "difficulty": "Hard" }
  ],
  "mcqs": [
    {
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 0
    }
  ]
}
Ensure the JSON is perfectly valid. Do not wrap with markdown or extra text.
Text to analyze:
${text}`;

  try {
    // Run the 3 requests concurrently
    const [summaryRes, explanationRes, questionsRes] = await Promise.all([
      openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: summarySystemPrompt },
          { role: 'user', content: summaryUserPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
      openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: explanationSystemPrompt },
          { role: 'user', content: explanationUserPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      }),
      openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: questionsSystemPrompt },
          { role: 'user', content: questionsUserPrompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    ]);

    // Parse the responses
    let summary, explanation, questions;
    try {
      summary = JSON.parse(summaryRes.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse summary response JSON:', summaryRes.choices[0].message.content);
      throw new Error('Invalid summary format returned by AI');
    }

    try {
      explanation = JSON.parse(explanationRes.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse explanation response JSON:', explanationRes.choices[0].message.content);
      throw new Error('Invalid explanation format returned by AI');
    }

    try {
      questions = JSON.parse(questionsRes.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse questions response JSON:', questionsRes.choices[0].message.content);
      throw new Error('Invalid questions format returned by AI');
    }

    return {
      summary,
      explanation,
      questions
    };

  } catch (error) {
    throw handleOpenAIError(error);
  }
}

module.exports = {
  generateStudyMaterial
};
