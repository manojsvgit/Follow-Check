import { LIMITS } from '../lib/parser'

export const MAX_UPLOAD_MB = LIMITS.maxZipBytes / (1024 * 1024)

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Plain-language copy for each failure the backend or network can produce.
const messages: Record<string, string> = {
  InvalidFileType: 'That is not a ZIP file. Choose the .zip you downloaded from Instagram.',
  UploadTooLarge: `That file is larger than ${MAX_UPLOAD_MB} MB. Request an export with only followers and following selected, then try again.`,
  MalformedZip: 'We could not open that ZIP. It may be damaged. Download your export again and retry.',
  ZipTooLarge: 'That archive is too large to process safely. Request an export with only followers and following selected.',
  EmptyArchive: 'The ZIP is empty. Download your export again and retry.',
  MissingFollowersFile: 'We could not find your followers list in this export. Request an export that includes Followers and following, in JSON format.',
  MissingFollowingFile: 'We could not find your following list in this export. Request an export that includes Followers and following, in JSON format.',
  MalformedJson: 'One of the files in the export is damaged. Download your export again and retry.',
  UnsupportedExportFormat: 'We found the files but could not read their format. If you chose HTML, request the export again as JSON.',
  EmptyOrUnrecognizedData: 'The export has no followers or following accounts in it.',
  UnexpectedError: 'Something went wrong on our side. Please try again in a moment.',
}

export function errorMessage(code: string): string {
  return messages[code] ?? messages.UnexpectedError
}

// Friendly early feedback only; the backend validates everything again.
export function validateFile(file: File): string | null {
  if (!file.name.toLowerCase().endsWith('.zip')) return errorMessage('InvalidFileType')
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return errorMessage('UploadTooLarge')
  return null
}
