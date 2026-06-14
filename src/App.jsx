import { useState } from 'react'
import TextInput from './components/TextInput'
import ResultsTabs from './components/ResultsTabs'
import { getMockResults } from './mockData'
import { generateStudyMaterial } from './api'
import CONFIG from './config'

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusNote, setStatusNote] = useState('')

  async function handleAnalyze(text) {
    setError('')
    setStatusNote('')
    
    const cleanedText = text.trim()
    if (!cleanedText) {
      setError('Please paste some text to analyze.')
      return
    }

    setLoading(true)
    
    try {
      // Step 1: Check for API Key
      if (!CONFIG.API_KEY) {
        console.warn('API Key missing, using mock data.');
        const mock = getMockResults(cleanedText);
        setResults(mock);
        setStatusNote('Set your API key in .env for real AI responses');
      } else {
        // Step 2: Try real AI
        try {
          const aiResults = await generateStudyMaterial(cleanedText);
          setResults(aiResults);
        } catch (aiErr) {
          console.error('AI API failed, falling back to mock:', aiErr);
          const mock = getMockResults(cleanedText);
          setResults(mock);
          setStatusNote('AI unavailable, showing demo');
        }
      }
    } catch (err) {
      console.error('Processing error:', err);
      setError('Could not process the text. Please try again.');
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResults(null)
    setError('')
    setStatusNote('')
    setLoading(false)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo" onClick={handleReset} style={{ cursor: 'pointer' }}>
            <span className="logo-icon">📚</span>
            StudySnap
          </h1>
          <p className="tagline">Paste text. Get exam-ready. In seconds.</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          {!results ? (
            <TextInput onSubmit={handleAnalyze} loading={loading} error={error} />
          ) : (
            <div className="results-container">
              {statusNote && (
                <div className="status-badge">
                  <span>ℹ️ {statusNote}</span>
                </div>
              )}
              <ResultsTabs results={results} />
              <div className="action-bar">
                <button className="btn btn-outline" onClick={handleReset}>
                  Analyze new text
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>StudySnap — AI-powered study assistant. No signup needed.</p>
      </footer>
    </div>
  )
}
