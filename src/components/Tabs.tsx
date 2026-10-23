export interface TabItem<K extends string> {
  key: K
  label: string
  count: number
}

interface Props<K extends string> {
  tabs: TabItem<K>[]
  active: K
  onChange: (key: K) => void
}

export function Tabs<K extends string>({ tabs, active, onChange }: Props<K>) {
  return (
    <div role="tablist" aria-label="Account lists" className="tabs">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`tab-${t.key}`}
          aria-selected={t.key === active}
          aria-controls="tabpanel"
          className="tab"
          onClick={() => onChange(t.key)}
        >
          {t.label} <span className="tab__count">{t.count.toLocaleString()}</span>
        </button>
      ))}
    </div>
  )
}
