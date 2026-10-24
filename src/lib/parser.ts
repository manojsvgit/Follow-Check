import { unzipSync } from 'fflate'

export type ExportErrorCode =
  | 'InvalidFileType'
  | 'UploadTooLarge'
  | 'MalformedZip'
  | 'ZipTooLarge'
  | 'EmptyArchive'
  | 'MissingFollowersFile'
  | 'MissingFollowingFile'
  | 'MalformedJson'
  | 'UnsupportedExportFormat'
  | 'EmptyOrUnrecognizedData'
  | 'UnexpectedError'

export class ExportError extends Error {
  readonly code: ExportErrorCode

  constructor(code: ExportErrorCode, message = code) {
    super(message)
    this.code = code
  }
}

export interface ExportData {
  followers: string[]
  following: string[]
  warnings: string[]
  /** Unix seconds of the earliest follow in the followers files, if the export has timestamps. */
  oldestFollower?: number
  followerFiles: number
  followingFiles: number
}

export const LIMITS = {
  maxZipBytes: 50 * 1024 * 1024,
  maxEntries: 10_000,
  maxEntryBytes: 100 * 1024 * 1024,
}

const FOLLOWERS_JSON = /^followers_\d+\.json$/i
const FOLLOWING_JSON = /^following\.json$/i
const EXPORT_HTML = /^(followers_\d+|following)\.html?$/i
const USERNAME = /^[A-Za-z0-9._]{1,30}$/

export function normalizeUsername(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.trim().replace(/^@+/, '').trim()
  return USERNAME.test(name) ? name : null
}

export async function readExport(file: File): Promise<ExportData> {
  if (!file.name.toLowerCase().endsWith('.zip')) throw new ExportError('InvalidFileType')
  if (file.size > LIMITS.maxZipBytes) throw new ExportError('UploadTooLarge')

  const bytes = new Uint8Array(await file.arrayBuffer())
  // ZIP local-file header, or the end record of an empty archive.
  const sig = bytes[0] === 0x50 && bytes[1] === 0x4b && (bytes[2] === 3 || bytes[2] === 5)
  if (!sig) throw new ExportError('InvalidFileType')

  // Only the followers/following JSON entries are ever inflated; everything else is skipped.
  // ponytail: sizes come from the ZIP header, so a lying header can still inflate more than declared.
  // The browser tab is the only thing at risk; add streaming inflate with a byte cap if that matters.
  let entries = 0
  let sawHtml = false
  let files: Record<string, Uint8Array>
  try {
    files = unzipSync(bytes, {
      filter({ name, originalSize }) {
        if (++entries > LIMITS.maxEntries) throw new ExportError('ZipTooLarge')
        const path = name.replaceAll('\\', '/')
        const base = path.slice(path.lastIndexOf('/') + 1)
        if (!base || path.split('/').includes('..')) return false
        if (EXPORT_HTML.test(base)) sawHtml = true
        if (!FOLLOWERS_JSON.test(base) && !FOLLOWING_JSON.test(base)) return false
        if (originalSize > LIMITS.maxEntryBytes) throw new ExportError('ZipTooLarge')
        return true
      },
    })
  } catch (e) {
    if (e instanceof ExportError) throw e
    throw new ExportError('MalformedZip')
  }

  if (entries === 0) throw new ExportError('EmptyArchive')

  const followerFiles: Uint8Array[] = []
  const followingFiles: Uint8Array[] = []
  for (const [name, data] of Object.entries(files)) {
    const base = name.slice(name.replaceAll('\\', '/').lastIndexOf('/') + 1)
    ;(FOLLOWERS_JSON.test(base) ? followerFiles : followingFiles).push(data)
  }

  if (followerFiles.length === 0 && followingFiles.length === 0 && sawHtml) throw new ExportError('UnsupportedExportFormat')
  if (followerFiles.length === 0) throw new ExportError('MissingFollowersFile')
  if (followingFiles.length === 0) throw new ExportError('MissingFollowingFile')

  let skipped = 0
  let oldestFollower: number | undefined
  const collect = (list: Uint8Array[], isFollowers: boolean) =>
    list.flatMap((data) => {
      const r = extractUsernames(data)
      skipped += r.skipped
      if (isFollowers && r.oldest !== undefined) oldestFollower = Math.min(oldestFollower ?? r.oldest, r.oldest)
      return r.names
    })
  const followers = collect(followerFiles, true)
  const following = collect(followingFiles, false)

  if (followers.length === 0 && following.length === 0) throw new ExportError('EmptyOrUnrecognizedData')

  const warnings = skipped
    ? [`${skipped} ${skipped === 1 ? 'entry was' : 'entries were'} skipped because no valid username could be read.`]
    : []
  return {
    followers, following, warnings, oldestFollower,
    followerFiles: followerFiles.length, followingFiles: followingFiles.length,
  }
}

function asObject(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function extractUsernames(data: Uint8Array): { names: string[]; skipped: number; oldest?: number } {
  let json: unknown
  try {
    json = JSON.parse(new TextDecoder().decode(data))
  } catch {
    throw new ExportError('MalformedJson')
  }

  // Wrapped form: { "relationships_following": [...] } (followers may use relationships_followers).
  const root = asObject(json)
  const entries = root ? (root.relationships_following ?? root.relationships_followers) : json
  if (!Array.isArray(entries)) throw new ExportError('UnsupportedExportFormat')

  const names: string[] = []
  let skipped = 0
  let oldest: number | undefined
  for (const entry of entries) {
    const e = asObject(entry)
    const list = e?.string_list_data
    if (!e || !Array.isArray(list)) throw new ExportError('UnsupportedExportFormat')

    let found = false
    for (const item of list) {
      const obj = asObject(item)
      const name = usernameFrom(e, obj)
      if (name) { names.push(name); found = true }
      const ts = obj?.timestamp
      if (typeof ts === 'number' && ts > 0) oldest = Math.min(oldest ?? ts, ts)
    }
    if (!found) skipped++
  }
  if (skipped > 0 && skipped === entries.length) throw new ExportError('UnsupportedExportFormat')
  return { names, skipped, oldest }
}

// Known patterns: item.value; newer exports put the name in entry.title or only in the profile href.
function usernameFrom(entry: Record<string, unknown>, item: Record<string, unknown> | null): string | null {
  if (!item) return null
  const fromValue = normalizeUsername(item.value) ?? normalizeUsername(entry.title)
  if (fromValue) return fromValue
  if (typeof item.href === 'string') {
    try {
      const url = new URL(item.href)
      if (url.hostname.endsWith('instagram.com')) return normalizeUsername(url.pathname.split('/').filter(Boolean).pop())
    } catch {
      /* not a URL */
    }
  }
  return null
}
