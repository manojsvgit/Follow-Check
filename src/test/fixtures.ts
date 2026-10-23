import { strToU8, zipSync } from 'fflate'

// Small synthetic Instagram-style exports. No real data.
export const followersJson = (...users: string[]) =>
  JSON.stringify(
    users.map((u) => ({
      title: '',
      string_list_data: [{ href: `https://www.instagram.com/${u}`, value: u, timestamp: 1700000000 }],
    })),
  )

export const followingJson = (...users: string[]) =>
  JSON.stringify({
    relationships_following: users.map((u) => ({
      title: u,
      string_list_data: [{ href: `https://www.instagram.com/_u/${u}`, timestamp: 1700000000 }],
    })),
  })

export const zipBytes = (files: Record<string, string>): Uint8Array =>
  zipSync(Object.fromEntries(Object.entries(files).map(([k, v]) => [k, strToU8(v)])))

export const zipFile = (files: Record<string, string>, name = 'export.zip'): File =>
  new File([zipBytes(files) as BlobPart], name, { type: 'application/zip' })

export const standardZip = (followers: string[], following: string[]) =>
  zipFile({
    'connections/followers_and_following/followers_1.json': followersJson(...followers),
    'connections/followers_and_following/following.json': followingJson(...following),
  })
