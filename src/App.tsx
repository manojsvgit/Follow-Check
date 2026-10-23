import { ThemeToggle } from './components/ThemeToggle'
import { LoadingScreen } from './features/analysis/LoadingScreen'
import { ResultsDashboard } from './features/analysis/ResultsDashboard'
import { UploadScreen } from './features/analysis/UploadScreen'
import { useAnalysis } from './hooks/useAnalysis'

export default function App() {
  const { state, analyze, reset } = useAnalysis()

  return (
    <div className="shell">
      <header className="topbar">
        <a className="wordmark" href="./" aria-label="FollowCheck home">FollowCheck</a>
        <ThemeToggle />
      </header>
      <main>
        {state.status === 'loading' && <LoadingScreen onCancel={reset} />}
        {state.status === 'success' && <ResultsDashboard result={state.result} onReset={reset} />}
        {(state.status === 'idle' || state.status === 'error') && (
          <UploadScreen
            serverError={state.status === 'error' ? state.message : null}
            onAnalyze={analyze}
            onDismissError={reset}
          />
        )}
      </main>
      <footer className="footer muted">
        Independent tool, not affiliated with Instagram or Meta. Results reflect your uploaded export only.
      </footer>
    </div>
  )
}
