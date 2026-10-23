import type { AnalyzeResponse } from '../types/api'

export function SummaryCards({ result }: { result: AnalyzeResponse }) {
  const cards = [
    { label: 'Followers', value: result.followersCount },
    { label: 'Following', value: result.followingCount },
    { label: 'Mutual follows', value: result.mutualFollowsCount },
    { label: "Don't follow back", value: result.notFollowingBackCount, highlight: true },
  ]
  return (
    <ul className="cards">
      {cards.map((c) => (
        <li key={c.label} className={`card${c.highlight ? ' card--highlight' : ''}`}>
          <span className="card__value">{c.value.toLocaleString()}</span>
          <span className="card__label">{c.label}</span>
        </li>
      ))}
    </ul>
  )
}
