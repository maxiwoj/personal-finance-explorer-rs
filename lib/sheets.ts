import { SPREADSHEET_ID, SHEETS_API_BASE, SHEETS } from './config'
import type { Transaction } from './types'

function parseTimestamp(timestampStr: string): Date {
  // Try parsing as ISO format first (e.g., 2024-03-15T10:30:00)
  const isoDate = new Date(timestampStr)
  if (!isNaN(isoDate.getTime())) {
    return isoDate
  }
  
  // Try DD/MM/YYYY HH:MM:SS format
  const dateTimeMatch = timestampStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s*(\d{1,2})?:?(\d{2})?:?(\d{2})?/)
  if (dateTimeMatch) {
    const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = dateTimeMatch
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )
  }
  
  // Fallback: DD/MM/YYYY
  const [day, month, year] = timestampStr.split('/').map(Number)
  return new Date(year, month - 1, day)
}

function parseRow(row: string[]): Transaction | null {
  try {
    if (row.length < 8) return null
    
    const [timestamp, what, category, amount, currency, amountPLN, monthYear, monthName, transactionId] = row
    
    if (!timestamp || !what || !category) return null
    
    return {
      timestamp: parseTimestamp(timestamp),
      what: what.trim(),
      category: category.trim().toLowerCase(),
      amountOriginal: parseFloat(amount) || 0,
      currency: currency?.trim() || 'PLN',
      amountPLN: parseFloat(amountPLN) || parseFloat(amount) || 0,
      monthYear: monthYear?.trim() || '',
      monthName: monthName?.trim() || '',
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
  const range = `${sheetName}!A:I`
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
