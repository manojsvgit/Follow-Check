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
  /** How many export files the lists were read from. */
  source?: { followerFiles: number; followingFiles: number; oldestFollower?: number }
}

export interface ApiError {
  code: string
  message: string
}

export type ListKey = 'notFollowingBack' | 'mutualFollows' | 'followersNotFollowedBack'
