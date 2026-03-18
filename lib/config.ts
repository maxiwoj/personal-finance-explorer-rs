export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
export const SPREADSHEET_ID = process.env.NEXT_PUBLIC_SPREADSHEET_ID || ''
export const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'

// Configurable sheet names
export const SHEETS = {
  RECENT: 'expenses2',  // ~100-200 rows, last 3 months
  FULL: 'expenses',     // Full transaction history
}

export const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly'

export const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'
