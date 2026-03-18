import type { Transaction } from './types'

const DEMO_DATA_URL = '/demo/demo-transactions.csv'
const DEMO_STORAGE_KEY = 'pfe_demo_transactions_v1'

interface DemoSeedRow {
  what: string
  category: string
  currency: string
  minAmount: number
  maxAmount: number
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
      continue
    }

    current += char
  }

  result.push(current)
  return result.map(value => value.trim())
}

async function loadDemoSeedRows(): Promise<DemoSeedRow[]> {
  const response = await fetch(DEMO_DATA_URL)
  if (!response.ok) {
    throw new Error('Failed to load demo dataset seed file')
  }

  const text = await response.text()
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)

  if (lines.length <= 1) return []

  return lines.slice(1).map(line => {
    const [what, category, currency, minAmount, maxAmount] = parseCsvLine(line)
    return {
      what,
      category,
      currency: currency || 'PLN',
      minAmount: Number(minAmount),
      maxAmount: Number(maxAmount),
    }
  }).filter(row => row.what && row.category && Number.isFinite(row.minAmount) && Number.isFinite(row.maxAmount))
}

function createRandomNumber(min: number, max: number) {
  const value = min + Math.random() * (max - min)
  return Math.round(value * 100) / 100
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

function createRandomDate(daysBack: number): Date {
  const now = new Date()
  const date = new Date(now)
  const offsetDays = Math.floor(Math.random() * daysBack)
  date.setDate(now.getDate() - offsetDays)
  date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60), 0)
  return date
}

function formatMonthYear(date: Date) {
  return `${date.getMonth() + 1}_${date.getFullYear()}`
}

function createTransaction(seed: DemoSeedRow, index: number): Transaction {
  const timestamp = createRandomDate(240)
  const amountOriginal = createRandomNumber(seed.minAmount, seed.maxAmount)

  return {
    timestamp,
    what: seed.what,
    category: seed.category.toLowerCase(),
    amountOriginal,
    currency: seed.currency,
    amountPLN: amountOriginal,
    monthYear: formatMonthYear(timestamp),
    monthName: '',
    transactionId: `demo-${index}-${Math.random().toString(36).slice(2, 10)}`,
  }
}

function buildDemoTransactions(seedRows: DemoSeedRow[]): Transaction[] {
  if (seedRows.length === 0) return []

  const transactionCount = 180
  const transactions = Array.from({ length: transactionCount }, (_, index) => {
    const seed = pickRandom(seedRows)
    return createTransaction(seed, index)
  })

  return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

function serializeTransactions(transactions: Transaction[]) {
  return JSON.stringify(transactions.map(transaction => ({
    ...transaction,
    timestamp: transaction.timestamp.toISOString(),
  })))
}

function deserializeTransactions(serialized: string | null): Transaction[] | null {
  if (!serialized) return null

  try {
    const parsed = JSON.parse(serialized) as Array<Omit<Transaction, 'timestamp'> & { timestamp: string }>
    return parsed.map(transaction => ({
      ...transaction,
      timestamp: new Date(transaction.timestamp),
    }))
  } catch {
    return null
  }
}

export function getStoredDemoTransactions(): Transaction[] | null {
  if (typeof window === 'undefined') return null
  return deserializeTransactions(window.localStorage.getItem(DEMO_STORAGE_KEY))
}

export function clearStoredDemoTransactions() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DEMO_STORAGE_KEY)
}

export async function getOrCreateDemoTransactions(forceReload = false): Promise<Transaction[]> {
  if (typeof window !== 'undefined' && !forceReload) {
    const stored = getStoredDemoTransactions()
    if (stored?.length) return stored
  }

  const seedRows = await loadDemoSeedRows()
  const generated = buildDemoTransactions(seedRows)

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(DEMO_STORAGE_KEY, serializeTransactions(generated))
  }

  return generated
}
