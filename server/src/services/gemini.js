const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini client lazily
let genAIInstance = null;

function getGenAIClient() {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const err = new Error('Gemini API key is missing. Please configure GEMINI_API_KEY in your .env file.');
      err.status = 401;
      throw err;
    }
    genAIInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAIInstance;
}

/**
 * Handle Gemini errors and map to standardized HTTP status codes
 */
function handleGeminiError(error) {
  console.error('Gemini Service Error:', error);
  const status = error.status || error.statusCode || 500;

  const err = new Error(error.message || 'Error communicating with Gemini');
  err.status = status;
  return err;
}

/**
 * Extracts JSON from a Gemini text response.
 * Gemini doesn't support response_format: json_object natively,
 * so we need to parse the text response and extract JSON from it.
 */
function extractJSON(text) {
  // Try to find JSON in markdown code blocks first
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch (e) {
      // Fall through to try parsing the whole text
    }
  }

  // Try to parse the entire text as JSON
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Try to find a JSON object in the text using regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e2) {
        throw new Error('Failed to parse JSON from Gemini response');
      }
    }
    throw new Error('Failed to parse JSON from Gemini response');
  }
}

/**
 * Generates study material using Google Gemini API by making 3 concurrent requests
 * for summary, explanation, and questions.
 */
async function generateStudyMaterial(text) {
  const genAI = getGenAIClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    const [summaryResult, explanationResult, questionsResult] = await Promise.all([
      model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: summarySystemPrompt + '\n\n' + summaryUserPrompt }] }
        ],
        generationConfig: {
          temperature: 0.3
        }
      }),
      model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: explanationSystemPrompt + '\n\n' + explanationUserPrompt }] }
        ],
        generationConfig: {
          temperature: 0.3
        }
      }),
      model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: questionsSystemPrompt + '\n\n' + questionsUserPrompt }] }
        ],
        generationConfig: {
          temperature: 0.3
        }
      })
    ]);

    // Parse the responses
    let summary, explanation, questions;

    try {
      const summaryText = summaryResult.response.text();
      summary = extractJSON(summaryText);
    } catch (e) {
      console.error('Failed to parse summary response JSON:', summaryResult.response.text());
      throw new Error('Invalid summary format returned by AI');
    }

    try {
      const explanationText = explanationResult.response.text();
      explanation = extractJSON(explanationText);
    } catch (e) {
      console.error('Failed to parse explanation response JSON:', explanationResult.response.text());
      throw new Error('Invalid explanation format returned by AI');
    }

    try {
      const questionsText = questionsResult.response.text();
      questions = extractJSON(questionsText);
    } catch (e) {
      console.error('Failed to parse questions response JSON:', questionsResult.response.text());
      throw new Error('Invalid questions format returned by AI');
    }

    return {
      summary,
      explanation,
      questions
    };

  } catch (error) {
    throw handleGeminiError(error);
  }
}

module.exports = {
  generateStudyMaterial
};