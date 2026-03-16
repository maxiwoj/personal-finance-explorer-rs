// Extended color palette with distinct, well-separated hues
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#ec4899', // pink
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#eab308', // yellow
  '#0ea5e9', // sky
  '#d946ef', // fuchsia
  '#22c55e', // green
  '#a855f7', // purple
  '#f43f5e', // rose
  '#64748b', // slate
  '#78716c', // stone
  '#0891b2', // cyan-600
]

// Track assigned colors to ensure uniqueness within a session
const assignedColors = new Map<string, string>()

// Better hash function with prime number multiplication for more distribution
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash * 33) ^ char) >>> 0
  }
  return hash
}

export function getCategoryColor(category: string): string {
  const key = category.toLowerCase().trim()
  
  // Return cached color if already assigned
  if (assignedColors.has(key)) {
    return assignedColors.get(key)!
  }
  
  // Find an unused color if possible
  const usedColors = new Set(assignedColors.values())
  const hash = hashString(key)
  
  // Try to find an unused color starting from the hash position
  for (let i = 0; i < COLORS.length; i++) {
    const colorIndex = (hash + i) % COLORS.length
    const color = COLORS[colorIndex]
    if (!usedColors.has(color)) {
      assignedColors.set(key, color)
      return color
    }
  }
  
  // All colors used, fall back to hash-based selection
  const color = COLORS[hash % COLORS.length]
  assignedColors.set(key, color)
  return color
}

export function getCategoryColors(categories: string[]): Record<string, string> {
  const colorMap: Record<string, string> = {}
  categories.forEach(category => {
    colorMap[category] = getCategoryColor(category)
  })
  return colorMap
}

// Reset assigned colors (useful for testing or when data changes)
export function resetCategoryColors(): void {
  assignedColors.clear()
}
