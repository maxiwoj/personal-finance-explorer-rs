import { SPREADSHEET_ID, SHEETS_API_BASE, SHEETS } from './config'
import type { Transaction } from './types'

function parseDate(dateStr: string): Date {
  // Format: DD/MM/YYYY
  const [day, month, year] = dateStr.split('/').map(Number)
  return new Date(year, month - 1, day)
}

function parseRow(row: string[]): Transaction | null {
  try {
    if (row.length < 8) return null
    
    const [timestamp, what, category, amount, currency, amountPLN, monthYear, monthName] = row
    
    if (!timestamp || !what || !category) return null
    
    return {
      timestamp: parseDate(timestamp),
      what: what.trim(),
      category: category.trim().toLowerCase(),
      amountOriginal: parseFloat(amount) || 0,
      currency: currency?.trim() || 'PLN',
      amountPLN: parseFloat(amountPLN) || parseFloat(amount) || 0,
      monthYear: monthYear?.trim() || '',
      monthName: monthName?.trim() || ''
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
