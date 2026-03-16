import { SPREADSHEET_ID, SHEETS_API_BASE, SHEETS } from './config'
import type { Transaction } from './types'

function parseTimestamp(timestampStr: string): Date {
  // Always try DD/MM/YYYY format first (European format)
  // Match: DD/MM/YYYY with optional time (any separator: space, T, or nothing)
  // Time formats: HH:MM, HH:MM:SS, H:MM, H:MM:SS
  const dateTimeMatch = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sT]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (dateTimeMatch) {
    const [, day, month, year, hours, minutes, seconds] = dateTimeMatch
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hours ? parseInt(hours) : 0,
      minutes ? parseInt(minutes) : 0,
      seconds ? parseInt(seconds) : 0
    )
  }
  
  // Try ISO format (e.g., 2024-03-15T10:30:00 or 2024-03-15 10:30:00)
  const isoMatch = timestampStr.match(/^(\d{4})-(\d{2})-(\d{2})(?:[\sT]+(\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (isoMatch) {
    const [, year, month, day, hours, minutes, seconds] = isoMatch
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      hours ? parseInt(hours) : 0,
      minutes ? parseInt(minutes) : 0,
      seconds ? parseInt(seconds) : 0
    )
  }
  
  // Last resort fallback - try native parsing
  const fallbackDate = new Date(timestampStr)
  if (!isNaN(fallbackDate.getTime())) {
    return fallbackDate
  }
  
  // Return current date if nothing works
  console.error('Failed to parse date:', timestampStr)
  return new Date()
}

function parseRow(row: string[]): Transaction | null {
  try {
    if (row.length < 7) return null
    
    // Columns: Timestamp, What, Category, Amount, Currency, AmountPLN, MonthYear, TransactionID
    const [timestamp, what, category, amount, currency, amountPLN, monthYear, transactionId] = row
    
    if (!timestamp || !what || !category) return null
    
    const parsedTimestamp = parseTimestamp(timestamp)
    
    // Generate monthYear from timestamp if not provided
    const derivedMonthYear = monthYear?.trim() || 
      `${parsedTimestamp.getMonth() + 1}_${parsedTimestamp.getFullYear()}`
    
    return {
      timestamp: parsedTimestamp,
      what: what.trim(),
      category: category.trim().toLowerCase(),
      amountOriginal: parseFloat(amount) || 0,
      currency: currency?.trim() || 'PLN',
      amountPLN: parseFloat(amountPLN) || parseFloat(amount) || 0,
      monthYear: derivedMonthYear,
      monthName: '', // Not used - derive from timestamp when needed
      transactionId: transactionId?.trim() || `${timestamp}-${what}-${Math.random().toString(36).slice(2, 8)}`
    }
  } catch {
    return null
  }
}

export async function fetchSheetData(
  accessToken: string,
  sheetName: string
): Promise<Transaction[]> {
  const range = `${sheetName}!A:H`
  const url = `${SHEETS_API_BASE}/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || 'Failed to fetch sheet data')
  }
  
  const data = await response.json()
  const rows: string[][] = data.values || []
  
  // Skip header row if present
  const dataRows = rows.length > 0 && rows[0][0]?.toLowerCase().includes('timestamp')
    ? rows.slice(1)
    : rows
  
  return dataRows
    .map(parseRow)
    .filter((t): t is Transaction => t !== null)
}

export async function fetchRecentTransactions(accessToken: string): Promise<Transaction[]> {
  return fetchSheetData(accessToken, SHEETS.RECENT)
}

export async function fetchFullTransactions(accessToken: string): Promise<Transaction[]> {
  return fetchSheetData(accessToken, SHEETS.FULL)
}
