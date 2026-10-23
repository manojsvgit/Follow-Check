import type { Account, AnalyzeResponse } from '../types/api'
import { normalizeUsername } from './parser'

// Cleans, dedupes ignoring case (first spelling wins).
function clean(names: string[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const raw of names) {
    const name = normalizeUsername(raw)
    if (name && !map.has(name.toLowerCase())) map.set(name.toLowerCase(), name)
  }
  return map
}

const toAccounts = (names: string[]): Account[] =>
  names
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()) || (a < b ? -1 : a > b ? 1 : 0))
    .map((username) => ({ username, profileUrl: `https://www.instagram.com/${username}/` }))

export function compare(followers: string[], following: string[], warnings: string[] = []): AnalyzeResponse {
  const fers = clean(followers)
  const fing = clean(following)
  const pick = (from: Map<string, string>, other: Map<string, string>, inOther: boolean) =>
    [...from].filter(([k]) => other.has(k) === inOther).map(([, v]) => v)

  const notFollowingBack = toAccounts(pick(fing, fers, false))
  const mutualFollows = toAccounts(pick(fing, fers, true))
  const followersNotFollowedBack = toAccounts(pick(fers, fing, false))

  return {
    followersCount: fers.size,
    followingCount: fing.size,
    mutualFollowsCount: mutualFollows.length,
    notFollowingBackCount: notFollowingBack.length,
    followersNotFollowedBackCount: followersNotFollowedBack.length,
    notFollowingBack,
    mutualFollows,
    followersNotFollowedBack,
    warnings,
  }
}
