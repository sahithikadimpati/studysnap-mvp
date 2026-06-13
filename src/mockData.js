/**
 * Mock AI responses for StudySnap MVP.
 * These simulate what a real AI API would return.
 */

function generateMockSummary(text) {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const points = []
  const words = text.split(/\s+/)

  for (let i = 0; i < Math.min(4, sentences.length); i++) {
    const s = sentences[i].trim()
    if (s.length > 10) {
      points.push(s.replace(/^[^a-zA-Z]*/, ''))
    }
  }

  if (points.length < 2) {
    points.push(`This text has ${words.length} words covering the key topic.`)
    points.push(`Main ideas can be derived from the content provided.`)
  }

  return {
    keyPoints: [
      points[0] || 'No summary available.',
      points[1] || 'Review the original text for key ideas.',
      points.length > 2 ? points[2] : 'Consider re-reading for thorough understanding.',
    ],
    oneLiner: `In brief: ${points[0]?.slice(0, 80) || 'A study topic worth reviewing.'}`,
  }
}

function generateMockExplanation(text) {
  const words = text.split(/\s+/)
  const topic = words.slice(0, Math.min(8, words.length)).join(' ')

  return {
    simpleExplanation: `${topic.slice(0, 60)}... Simply put, this is about understanding core concepts by breaking them down into smaller, relatable pieces. Think of it like learning to ride a bike — at first it seems complex, but once you understand the basics of balance and pedaling, everything clicks into place.`,
    analogy: `Think of it like this: Imagine you're building with LEGO blocks. Each small piece (concept) might not make sense alone, but when you connect them correctly, they form something meaningful and complete.`,
    breakdown: [
      `Start with the fundamentals — what is this really about?`,
      `Connect it to something you already know from daily life.`,
      `Practice applying the concept in different scenarios.`,
      `Review and refine your understanding over time.`,
    ],
  }
}

function generateMockQuestions(text) {
  const words = text.split(/\s+/)
  const topic = words.slice(0, 5).join(' ')

  return {
    importantQuestions: [
      { q: `What are the key principles of ${topic.slice(0, 40)}?`, difficulty: 'Easy' },
      { q: `Explain how the concepts in this text connect to real-world applications.`, difficulty: 'Medium' },
      { q: `Analyze the relationship between the main ideas presented. What patterns emerge?`, difficulty: 'Hard' },
      { q: `If you had to teach this topic to a classmate in 2 minutes, what would you say?`, difficulty: 'Medium' },
    ],
    mcqs: [
      {
        question: `Based on the text, which of the following best describes the main theme?`,
        options: ['The core concepts and their relationships', 'A historical timeline', 'A mathematical proof', 'A step-by-step guide'],
        correct: 0,
      },
      {
        question: `What approach would best help understand this topic?`,
        options: ['Memorization', 'Breaking it down into smaller parts', 'Skipping to the end', 'Only reading examples'],
        correct: 1,
      },
    ],
  }
}

export function getMockResults(text) {
  const cleaned = text.trim()
  if (!cleaned) return null

  return {
    summary: generateMockSummary(cleaned),
    explanation: generateMockExplanation(cleaned),
    questions: generateMockQuestions(cleaned),
  }
}