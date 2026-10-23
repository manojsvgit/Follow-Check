interface Props {
  message: string
  onRetry: () => void
}

export function ErrorNotice({ message, onRetry }: Props) {
  return (
    <div role="alert" className="notice notice--error">
      <p><strong>We could not analyze that export.</strong></p>
      <p>{message}</p>
      <button type="button" className="btn btn--secondary" onClick={onRetry}>Try another file</button>
    </div>
  )
}
