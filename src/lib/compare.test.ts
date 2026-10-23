import { describe, expect, it } from 'vitest'
import { compare } from './compare'

const names = (a: { username: string }[]) => a.map((x) => x.username)

describe('compare', () => {
  it('handles both lists empty', () => {
    const r = compare([], [])
    expect(r.followersCount + r.followingCount).toBe(0)
    expect(r.notFollowingBack).toEqual([])
  })

  it('all follow back', () => {
    const r = compare(['a', 'b'], ['a', 'b'])
    expect(r.notFollowingBack).toEqual([])
    expect(names(r.mutualFollows)).toEqual(['a', 'b'])
  })

  it('finds following-only and followers-only', () => {
    const r = compare(['a', 'x'], ['a', 'b', 'c'])
    expect(names(r.notFollowingBack)).toEqual(['b', 'c'])
    expect(names(r.followersNotFollowedBack)).toEqual(['x'])
  })

  it('counts duplicates once and ignores case', () => {
    const r = compare(['a', 'a', 'A', 'Alice_Smith'], ['alice_smith', 'b', 'b'])
    expect(r.followersCount).toBe(2)
    expect(r.followingCount).toBe(2)
    expect(names(r.mutualFollows).map((n) => n.toLowerCase())).toEqual(['alice_smith'])
  })

  it('drops blank and invalid names and trims @', () => {
    const r = compare([], ['', '  ', '@bob', 'not valid!', ' carol '])
    expect(names(r.notFollowingBack)).toEqual(['bob', 'carol'])
    expect(r.followingCount).toBe(2)
  })

  it('sorts case-insensitively and deterministically', () => {
    const r1 = compare([], ['b', 'A', 'c', 'B2'])
    const r2 = compare([], ['B2', 'c', 'A', 'b'])
    expect(names(r1.notFollowingBack)).toEqual(['A', 'b', 'B2', 'c'])
    expect(r1.notFollowingBack).toEqual(r2.notFollowingBack)
  })

  it('counts add up and profile URLs use the fixed base', () => {
    const r = compare(['a', 'b', 'x'], ['a', 'b', 'c', 'd'])
    expect(r.followingCount).toBe(r.mutualFollowsCount + r.notFollowingBackCount)
    expect(r.followersCount).toBe(r.mutualFollowsCount + r.followersNotFollowedBackCount)
    expect(r.notFollowingBack[0].profileUrl).toBe('https://www.instagram.com/c/')
  })
})
