import type { AnalyzeResponse } from '../types/api'
import { compare } from './compare'
import { readExport } from './parser'

// Everything runs in the browser: the ZIP never leaves the user's device.
export async function analyzeExport(file: File): Promise<AnalyzeResponse> {
  const { followers, following, warnings, followerFiles, followingFiles, oldestFollower } = await readExport(file)
  return {
    ...compare(followers, following, warnings),
    source: { followerFiles, followingFiles, oldestFollower },
  }
}
