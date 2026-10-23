import type { Account } from '../types/api'

const FORMULA_START = /^[=+\-@\t\r]/

// Quotes fields that need it, doubles inner quotes, and prefixes a ' to anything a spreadsheet
// could read as a formula. Valid usernames never start with those characters; this is defence in depth.
export function escapeCsvField(value: string): string {
  const safe = FORMULA_START.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe
}

export function toCsv(accounts: Account[]): string {
  const rows = accounts.map((a) => `${escapeCsvField(a.username)},${escapeCsvField(a.profileUrl)}`)
  return ['username,profile_url', ...rows].join('\r\n') + '\r\n'
}

export function downloadCsv(filename: string, accounts: Account[]): void {
  const url = URL.createObjectURL(new Blob([toCsv(accounts)], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
