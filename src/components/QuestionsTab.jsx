import { useState } from 'react'

function MCQCard({ mcq, index }) {
  const [selected, setSelected] = useState(null)
  const [revealed, setRevealed] = useState(false)

  function handleSelect(i) {
    if (revealed) return
    setSelected(i)
    setRevealed(true)
  }

  const isCorrect = selected === mcq.correct

  return (
    <div className={`mcq-card ${revealed ? (isCorrect ? 'correct' : 'wrong') : ''}`}>
      <p className="mcq-question">
        <strong>Q{index + 1}:</strong> {mcq.question}
      </p>
      <div className="mcq-options">
        {mcq.options.map((opt, i) => {
          let cls = 'mcq-option'
          if (revealed) {
            if (i === mcq.correct) cls += ' correct-answer'
            if (i === selected && !isCorrect) cls += ' wrong-answer'
            if (i === selected) cls += ' selected'
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleSelect(i)}
              disabled={revealed}
            >
              <span className="option-label">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{opt}</span>
              {revealed && i === mcq.correct && <span className="check-mark">✓</span>}
            </button>
          )
        })}
      </div>
      {revealed && (
        <p className="mcq-feedback">
          {isCorrect ? '✅ Correct!' : `❌ The correct answer is ${mcq.options[mcq.correct]}`}
        </p>
      )}
    </div>
  )
}

export default function QuestionsTab({ data }) {
  if (!data) return null

  return (
    <div className="tab-panel questions-tab">
      <div className="questions-section">
        <h3>📝 Important Questions</h3>
        <div className="questions-list">
          {data.importantQuestions.map((item, i) => (
            <div key={i} className="question-card">
              <div className="question-header">
                <span className="question-num">Q{i + 1}</span>
                <span className={`difficulty-badge ${item.difficulty.toLowerCase()}`}>
                  {item.difficulty}
                </span>
              </div>
              <p>{item.q}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="questions-section">
        <h3>📊 Multiple Choice Questions</h3>
        {data.mcqs.map((mcq, i) => (
          <MCQCard key={i} mcq={mcq} index={i} />
        ))}
      </div>
    </div>
  )
}