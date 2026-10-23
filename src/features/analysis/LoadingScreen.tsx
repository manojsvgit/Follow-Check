import { useEffect, useState } from 'react'

const stages = ['Validating export', 'Reading account lists', 'Comparing accounts']

// Stage text is a status message, not a progress measure: the backend does not report progress.
export function LoadingScreen({ onCancel }: { onCancel: () => void }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setStage((s) => Math.min(s + 1, stages.length - 1)), 1500)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="loading" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <p className="lede">{stages[stage]}…</p>
      <button type="button" className="btn btn--secondary" onClick={onCancel}>Cancel</button>
    </section>
  )
}
