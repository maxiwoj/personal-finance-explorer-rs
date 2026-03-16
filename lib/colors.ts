// Deterministic color mapping based on category hash
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#eab308', // yellow
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function getCategoryColor(category: string): string {
  const hash = hashString(category.toLowerCase())
  return COLORS[hash % COLORS.length]
}

export function getCategoryColors(categories: string[]): Record<string, string> {
  const colorMap: Record<string, string> = {}
  categories.forEach(category => {
    colorMap[category] = getCategoryColor(category)
  })
  return colorMap
}
