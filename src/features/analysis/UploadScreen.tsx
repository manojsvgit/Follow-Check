import { useState } from 'react'
import { Dropzone } from '../../components/Dropzone'
import { ErrorNotice } from '../../components/ErrorNotice'
import { PrivacyHelp } from '../../components/PrivacyHelp'
import { MAX_UPLOAD_MB, validateFile } from '../../utils/file'

interface Props {
  serverError: string | null
  onAnalyze: (file: File) => void
  onDismissError: () => void
}

const steps = [
  ['Request your data', "Ask Instagram for Followers and following, JSON format, date range All time."],
  ['Upload the ZIP', 'Drop the file you receive here. It stays on your device and only the two lists are read.'],
  ['See who is not following back', 'Browse the lists, search for a name and open any profile.'],
]

export function UploadScreen({ serverError, onAnalyze, onDismissError }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const select = (f: File | null) => {
    setFile(null)
    setFileError(null)
    if (!f) return
    const problem = validateFile(f)
    if (problem) setFileError(problem)
    else setFile(f)
  }

  if (serverError) {
    return <ErrorNotice message={serverError} onRetry={onDismissError} />
  }

  return (
    <>
      <section className="hero">
        <h1>Find out who doesn't follow you back.</h1>
        <p className="lede">Analyze your own Instagram data export. No Instagram password required.</p>
      </section>

      <ol className="steps">
        {steps.map(([title, text]) => (
          <li key={title}><strong>{title}</strong><span>{text}</span></li>
        ))}
      </ol>

      <p className="notice notice--warn" data-testid="export-tip">
        <strong>When you request your export, set Date range to “All time”</strong> and choose the JSON format. A shorter
        range leaves out older followers, and they would wrongly show as not following you back.
      </p>

      <Dropzone file={file} error={fileError} onSelect={select} />
      <div className="actions">
        <button type="button" className="btn" disabled={!file} onClick={() => file && onAnalyze(file)}>
          Analyze export
        </button>
        <span className="muted">Maximum file size: {MAX_UPLOAD_MB} MB</span>
      </div>

      <PrivacyHelp />
    </>
  )
}
