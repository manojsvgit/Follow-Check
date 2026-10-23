import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadCsv, escapeCsvField, toCsv } from './csv'

describe('csv', () => {
  afterEach(() => vi.restoreAllMocks())

  it('escapes commas, quotes and newlines', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"')
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvField('line\nbreak')).toBe('"line\nbreak"')
    expect(escapeCsvField('plain')).toBe('plain')
  })

  it('prefixes spreadsheet formula starters', () => {
    for (const s of ['=1+1', '+1', '-1', '@x', '\tx']) expect(escapeCsvField(s).startsWith("'")).toBe(true)
  })

  it('builds a header and one row per account', () => {
    const csv = toCsv([{ username: 'a', profileUrl: 'https://www.instagram.com/a/' }])
    expect(csv).toBe('username,profile_url\r\na,https://www.instagram.com/a/\r\n')
  })

  it('downloads with the given name and revokes the object URL', () => {
    const create = vi.fn(() => 'blob:x')
    const revoke = vi.fn()
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadCsv('followcheck-test.csv', [{ username: 'a', profileUrl: 'u' }])

    expect(create).toHaveBeenCalledOnce()
    expect(click).toHaveBeenCalledOnce()
    expect(revoke).toHaveBeenCalledWith('blob:x')
    vi.unstubAllGlobals()
  })
})
