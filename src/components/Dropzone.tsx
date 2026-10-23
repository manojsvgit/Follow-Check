import { useRef, useState } from 'react'
import { formatSize, MAX_UPLOAD_MB } from '../utils/file'

interface Props {
  file: File | null
  error: string | null
  disabled?: boolean
  onSelect: (file: File | null) => void
}

export function Dropzone({ file, error, disabled, onSelect }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = (list: FileList | null) => onSelect(list?.[0] ?? null)

  return (
    <div
      className={`dropzone${dragging ? ' dropzone--drag' : ''}${error ? ' dropzone--error' : ''}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        if (!disabled) pick(e.dataTransfer.files)
      }}
    >
      <input
        ref={input}
        id="export-file"
        className="visually-hidden"
        type="file"
        accept=".zip,application/zip"
        disabled={disabled}
        onChange={(e) => pick(e.target.files)}
      />
      <label htmlFor="export-file" className="dropzone__label">
        <strong>
          <span className="drop">Drop your Instagram export ZIP here</span>
          <span className="tap">Tap to choose your Instagram export ZIP</span>
        </strong>
        <span>
          <span className="drop">or click to choose a file</span>
          <span className="tap">from Files or Downloads</span> · up to {MAX_UPLOAD_MB} MB
        </span>
      </label>
      {file && (
        <p className="dropzone__file" data-testid="selected-file">
          <span className="dropzone__name">{file.name}</span>
          <span className="muted">{formatSize(file.size)}</span>
        </p>
      )}
      {error && <p role="alert" className="dropzone__error">{error}</p>}
    </div>
  )
}
