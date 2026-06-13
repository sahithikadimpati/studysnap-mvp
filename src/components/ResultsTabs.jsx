import { useState } from 'react'
import SummaryTab from './SummaryTab'
import ExplainTab from './ExplainTab'
import QuestionsTab from './QuestionsTab'

const TABS = [
  { id: 'summary', label: 'Summary', icon: '📝' },
  { id: 'explain', label: 'Explain', icon: '💡' },
  { id: 'questions', label: 'Questions', icon: '🎯' },
]

export default function ResultsTabs({ results }) {
  const [activeTab, setActiveTab] = useState('summary')

  if (!results) return null

  return (
    <div className="results-section">
      <div className="tabs-header">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'summary' && <SummaryTab data={results.summary} />}
        {activeTab === 'explain' && <ExplainTab data={results.explanation} />}
        {activeTab === 'questions' && <QuestionsTab data={results.questions} />}
      </div>
    </div>
  )
}