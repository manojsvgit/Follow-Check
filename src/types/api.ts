export interface Account {
  username: string
  profileUrl: string
}

export interface AnalyzeResponse {
  followersCount: number
  followingCount: number
  mutualFollowsCount: number
  notFollowingBackCount: number
  followersNotFollowedBackCount: number
  notFollowingBack: Account[]
  mutualFollows: Account[]
  followersNotFollowedBack: Account[]
  warnings: string[]
}

export interface ApiError {
  code: string
  message: string
}

export type ListKey = 'notFollowingBack' | 'mutualFollows' | 'followersNotFollowedBack'
