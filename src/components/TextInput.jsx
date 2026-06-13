import { useState, useRef } from 'react'

export default function TextInput({ onSubmit, loading, error }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit(text)
  }

  function handleKeyDown(e) {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onSubmit(text)
    }
  }

  return (
    <div className="input-section">
      <div className="input-card">
        <h2 className="input-title">Paste your study material</h2>
        <p className="input-desc">
          Paste any text — lecture notes, textbook excerpts, or articles — and get
          instant summaries, explanations, and exam questions.
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            className="text-input"
            placeholder="Paste your text here... (e.g., a paragraph from your textbook or lecture notes)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={8}
            disabled={loading}
          />

          {error && <p className="error-msg">{error}</p>}

          <div className="input-actions">
            <span className="hint">
              {text.length > 0 ? `${text.length} characters` : ''}
            </span>
            <button
              type="submit"
              className={`btn btn-primary ${loading ? 'loading' : ''}`}
              disabled={loading || !text.trim()}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span className="btn-icon">✨</span>
                  Snap It!
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="features-row">
        <div className="feature-chip">
          <span className="chip-icon">📝</span> Summarize
        </div>
        <div className="feature-chip">
          <span className="chip-icon">💡</span> Explain
        </div>
        <div className="feature-chip">
          <span className="chip-icon">🎯</span> Exam Qs
        </div>
      </div>
    </div>
  )
}