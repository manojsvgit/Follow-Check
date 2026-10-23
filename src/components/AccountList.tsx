import type { Account } from '../types/api'

// A stable hue per username so each account keeps the same avatar colour.
function hue(name: string): number {
  let h = 0
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 360
  return h
}

function Avatar({ username }: { username: string }) {
  const h = hue(username)
  const initial = username.replace(/[^a-z0-9]/gi, '').charAt(0).toUpperCase() || '?'
  return (
    <span
      className="avatar"
      aria-hidden="true"
      style={{ background: `hsl(${h} 60% var(--avatar-bg-l))`, color: `hsl(${h} 55% var(--avatar-fg-l))` }}
    >
      {initial}
    </span>
  )
}

export function AccountList({ accounts }: { accounts: Account[] }) {
  return (
    <ul className="accounts">
      {accounts.map((a) => (
        <li key={a.username} className="account">
          <Avatar username={a.username} />
          <span className="account__name">@{a.username}</span>
          <a
            className="profile-btn"
            href={a.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open profile of ${a.username}`}
          >
            Open profile
          </a>
        </li>
      ))}
    </ul>
  )
}
