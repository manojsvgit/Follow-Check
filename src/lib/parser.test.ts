import { describe, expect, it } from 'vitest'
import { followersJson, followingJson, zipFile } from '../test/fixtures'
import { ExportError, LIMITS, readExport } from './parser'

const codeOf = async (file: File) => {
  try {
    await readExport(file)
  } catch (e) {
    if (e instanceof ExportError) return e.code
    throw e
  }
  return 'no error'
}

describe('readExport', () => {
  it('parses a standard nested export (usernames from value and title)', async () => {
    const d = await readExport(zipFile({
      'connections/followers_and_following/followers_1.json': followersJson('alice', 'bob'),
      'connections/followers_and_following/following.json': followingJson('bob', 'carol'),
    }))
    expect(d.followers).toEqual(['alice', 'bob'])
    expect(d.following).toEqual(['bob', 'carol'])
  })

  it('merges numbered follower files', async () => {
    const d = await readExport(zipFile({
      'followers_1.json': followersJson('a', 'b'),
      'followers_2.json': followersJson('c'),
      'following.json': followingJson('a'),
    }))
    expect(d.followers).toHaveLength(3)
  })

  it('ignores unrelated files, even broken ones', async () => {
    const d = await readExport(zipFile({
      'posts/posts_1.json': '{ not json',
      'readme.txt': 'hi',
      'followers_1.json': followersJson('a'),
      'following.json': followingJson('b'),
    }))
    expect(d.followers).toEqual(['a'])
  })

  it('reports missing files', async () => {
    expect(await codeOf(zipFile({ 'following.json': followingJson('a') }))).toBe('MissingFollowersFile')
    expect(await codeOf(zipFile({ 'followers_1.json': followersJson('a') }))).toBe('MissingFollowingFile')
  })

  it('reports malformed JSON', async () => {
    expect(await codeOf(zipFile({ 'followers_1.json': '{oops', 'following.json': followingJson('a') }))).toBe('MalformedJson')
  })

  it('reports non-ZIP content and wrong extension', async () => {
    expect(await codeOf(new File(['definitely not a zip'], 'a.zip'))).toBe('InvalidFileType')
    expect(await codeOf(new File(['x'], 'a.txt'))).toBe('InvalidFileType')
  })

  it('reports a damaged ZIP', async () => {
    const bad = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5, 6])], 'a.zip')
    expect(await codeOf(bad)).toBe('MalformedZip')
  })

  it('reports an empty archive', async () => {
    expect(await codeOf(zipFile({}))).toBe('EmptyArchive')
  })

  it('reports unrecognized JSON shapes', async () => {
    expect(await codeOf(zipFile({ 'followers_1.json': '{"hello":1}', 'following.json': followingJson('a') }))).toBe('UnsupportedExportFormat')
    expect(await codeOf(zipFile({ 'followers_1.json': '[{"foo":1}]', 'following.json': followingJson('a') }))).toBe('UnsupportedExportFormat')
  })

  it('gives a helpful error for HTML-only exports', async () => {
    expect(await codeOf(zipFile({ 'followers_1.html': '<html/>', 'following.html': '<html/>' }))).toBe('UnsupportedExportFormat')
  })

  it('rejects an export with both lists empty', async () => {
    expect(await codeOf(zipFile({ 'followers_1.json': '[]', 'following.json': '{"relationships_following":[]}' }))).toBe('EmptyOrUnrecognizedData')
  })

  it('skips invalid usernames with a warning', async () => {
    const d = await readExport(zipFile({
      'followers_1.json': followersJson('good_one', 'bad name!'),
      'following.json': followingJson('good_one'),
    }))
    expect(d.followers).toEqual(['good_one'])
    expect(d.warnings).toHaveLength(1)
  })

  it('rejects too many entries', async () => {
    const files: Record<string, string> = {}
    for (let i = 0; i <= LIMITS.maxEntries; i++) files[`f${i}.txt`] = 'x'
    expect(await codeOf(zipFile(files))).toBe('ZipTooLarge')
  })

  it('rejects an oversized upload', async () => {
    const big = new File([new Uint8Array(LIMITS.maxZipBytes + 1)], 'big.zip')
    expect(await codeOf(big)).toBe('UploadTooLarge')
  })
})
