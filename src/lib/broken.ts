const STORAGE_KEY = 'medtest.broken.v1'

export type BrokenSet = Set<string>

export function loadBroken(): BrokenSet {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

export function saveBroken(ids: BrokenSet): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function clearBroken(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function markBroken(ids: BrokenSet, id: string): BrokenSet {
  const next = new Set(ids)
  next.add(id)
  return next
}

export function unmarkBroken(ids: BrokenSet, id: string): BrokenSet {
  const next = new Set(ids)
  next.delete(id)
  return next
}

/** Drop broken ids from a pool (progress keys stay intact). */
export function excludeBroken(poolIds: string[], broken: BrokenSet): string[] {
  if (broken.size === 0) return poolIds
  return poolIds.filter((id) => !broken.has(id))
}
