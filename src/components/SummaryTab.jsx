export default function SummaryTab({ data }) {
  if (!data) return null

  return (
    <div className="tab-panel summary-tab">
      <div className="summary-card highlight">
        <h3>📌 One-Liner</h3>
        <p>{data.oneLiner}</p>
      </div>

      <div className="summary-card">
        <h3>🔑 Key Points</h3>
        <ul className="key-points-list">
          {data.keyPoints.map((point, i) => (
            <li key={i}>
              <span className="point-marker">{i + 1}</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}