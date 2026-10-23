import { useCallback, useRef, useState } from 'react'
import { analyzeExport } from '../lib/analyze'
import { ExportError } from '../lib/parser'
import type { AnalyzeResponse } from '../types/api'
import { errorMessage } from '../utils/file'

export type AnalysisState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; result: AnalyzeResponse }
  | { status: 'error'; code: string; message: string }

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' })
  const run = useRef(0) // bumped on reset so a cancelled run's result is ignored
  const busy = useRef(false)

  const analyze = useCallback(async (file: File) => {
    if (busy.current) return // ignore duplicate submissions while one is running
    busy.current = true
    const mine = ++run.current
    setState({ status: 'loading' })
    try {
      const result = await analyzeExport(file)
      if (run.current === mine) setState({ status: 'success', result })
    } catch (e) {
      const code = e instanceof ExportError ? e.code : 'UnexpectedError'
      if (run.current === mine) setState({ status: 'error', code, message: errorMessage(code) })
    } finally {
      if (run.current === mine) busy.current = false
    }
  }, [])

  const reset = useCallback(() => {
    run.current++
    busy.current = false
    setState({ status: 'idle' })
  }, [])

  return { state, analyze, reset }
}
