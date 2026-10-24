import { useMemo, useState } from 'react'
import { AccountList } from '../../components/AccountList'
import { EmptyState } from '../../components/EmptyState'
import { SummaryCards } from '../../components/SummaryCards'
import { Tabs, type TabItem } from '../../components/Tabs'
import type { AnalyzeResponse, ListKey } from '../../types/api'

const PAGE = 200

const meta: Record<ListKey, { label: string; empty: string }> = {
  notFollowingBack: { label: "Don't follow back", empty: 'Everyone you follow follows you back.' },
  mutualFollows: { label: 'Mutual follows', empty: 'You have no mutual follows in this export.' },
  followersNotFollowedBack: { label: "Followers you don't follow back", empty: 'You follow everyone who follows you.' },
}

export function ResultsDashboard({ result, onReset }: { result: AnalyzeResponse; onReset: () => void }) {
  const [active, setActive] = useState<ListKey>('notFollowingBack')
  const [query, setQuery] = useState('')
  const [ascending, setAscending] = useState(true)
  const [visible, setVisible] = useState(PAGE)

  const tabs: TabItem<ListKey>[] = [
    { key: 'notFollowingBack', label: meta.notFollowingBack.label, count: result.notFollowingBackCount },
    { key: 'mutualFollows', label: meta.mutualFollows.label, count: result.mutualFollowsCount },
    { key: 'followersNotFollowedBack', label: meta.followersNotFollowedBack.label, count: result.followersNotFollowedBackCount },
  ]

  const filtered = useMemo(() => {
    const q = query.trim().replace(/^@/, '').toLowerCase()
    const matches = result[active].filter((a) => a.username.toLowerCase().includes(q))
    return ascending ? matches : [...matches].reverse() // the API already returns A–Z
  }, [result, active, query, ascending])

  const change = (key: ListKey) => { setActive(key); setVisible(PAGE) }

  return (
    <>
      <div className="results-head">
        <h1>Your results</h1>
        <button type="button" className="btn btn--secondary" onClick={onReset}>Analyze another export</button>
      </div>
      <p className="notice">
        These results come from the export you uploaded. They reflect the date it was generated, not live Instagram data.
      </p>
      {result.source && (
        <p className="notice">
          Read {result.followersCount.toLocaleString()} followers and {result.followingCount.toLocaleString()} following.
          {result.source.oldestFollower !== undefined && (
            <> Your followers list goes back to {new Date(result.source.oldestFollower * 1000).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}.</>
          )}{' '}
          Compare these totals with your Instagram profile. If followers looks too low, request the export again with the
          date range set to <strong>All time</strong>.
        </p>
      )}
      {result.warnings.map((w) => <p key={w} className="notice notice--warn">{w}</p>)}

      <SummaryCards result={result} />
      <Tabs tabs={tabs} active={active} onChange={change} />

      <div className="toolbar">
        <label className="visually-hidden" htmlFor="search">Search accounts</label>
        <input
          id="search"
          type="search"
          placeholder="Search usernames"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setVisible(PAGE) }}
        />
        <button type="button" className="btn btn--secondary" onClick={() => setAscending((a) => !a)}>
          Sort: {ascending ? 'A → Z' : 'Z → A'}
        </button>
      </div>

      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${active}`}>
        <p className="muted" aria-live="polite">
          Showing {Math.min(visible, filtered.length).toLocaleString()} of {filtered.length.toLocaleString()} accounts
        </p>
        {filtered.length === 0
          ? <EmptyState message={query ? 'No accounts match your search.' : meta[active].empty} />
          : <AccountList accounts={filtered.slice(0, visible)} />}
        {filtered.length > visible && (
          <button type="button" className="btn btn--secondary" onClick={() => setVisible((v) => v + PAGE)}>
            Show more
          </button>
        )}
      </div>
    </>
  )
}
