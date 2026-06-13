import { useState } from 'react'
import TextInput from './components/TextInput'
import ResultsTabs from './components/ResultsTabs'
import { getMockResults } from './mockData'

export default function App() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleAnalyze(text) {
    setError('')
    if (!text.trim()) {
      setError('Please paste some text to analyze.')
      return
    }

    setLoading(true)
    // Simulate AI processing delay
    setTimeout(() => {
      try {
        const mock = getMockResults(text)
        if (mock) {
          setResults(mock)
        } else {
          setError('Could not analyze the text. Please try again.')
        }
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 1200)
  }

  function handleReset() {
    setResults(null)
    setError('')
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
            <>
              <ResultsTabs results={results} />
              <div className="action-bar">
                <button className="btn btn-outline" onClick={handleReset}>
                  Analyze new text
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>StudySnap — AI-powered study assistant. No signup needed.</p>
      </footer>
    </div>
  )
}