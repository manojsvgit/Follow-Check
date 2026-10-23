import { useMemo, useState } from 'react'
import { AccountList } from '../../components/AccountList'
import { EmptyState } from '../../components/EmptyState'
import { SummaryCards } from '../../components/SummaryCards'
import { Tabs, type TabItem } from '../../components/Tabs'
import type { AnalyzeResponse, ListKey } from '../../types/api'
import { downloadCsv } from '../../utils/csv'

const PAGE = 200

const meta: Record<ListKey, { label: string; file: string; empty: string }> = {
  notFollowingBack: {
    label: "Don't follow back",
    file: 'followcheck-not-following-back.csv',
    empty: 'Everyone you follow follows you back.',
  },
  mutualFollows: {
    label: 'Mutual follows',
    file: 'followcheck-mutual-follows.csv',
    empty: 'You have no mutual follows in this export.',
  },
  followersNotFollowedBack: {
    label: "Followers you don't follow back",
    file: 'followcheck-followers-not-followed-back.csv',
    empty: 'You follow everyone who follows you.',
  },
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
        <button
          type="button"
          className="btn btn--secondary"
          disabled={filtered.length === 0}
          onClick={() => downloadCsv(meta[active].file, filtered)}
        >
          Download CSV
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
