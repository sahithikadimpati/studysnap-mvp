export default function ExplainTab({ data }) {
  if (!data) return null

  return (
    <div className="tab-panel explain-tab">
      <div className="explain-card">
        <h3>🧠 Simple Explanation</h3>
        <p className="explain-text">{data.simpleExplanation}</p>
      </div>

      <div className="explain-card analogy-card">
        <h3>🔄 Analogy</h3>
        <p>{data.analogy}</p>
      </div>

      <div className="explain-card">
        <h3>📋 Step-by-Step Breakdown</h3>
        <ol className="breakdown-list">
          {data.breakdown.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}