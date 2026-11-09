import type { ProgressMap, QuestionProgress } from '../types'

const STORAGE_KEY = 'medtest.progress.v1'

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as ProgressMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function saveProgress(map: ProgressMap): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function clearProgress(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function emptyProgress(): QuestionProgress {
  return { correctCount: 0, seenCount: 0, mastered: false, lastSeen: 0 }
}

export function markSeen(map: ProgressMap, id: string): ProgressMap {
  const prev = map[id] ?? emptyProgress()
  return {
    ...map,
    [id]: {
      ...prev,
      seenCount: prev.seenCount + 1,
      lastSeen: Date.now(),
    },
  }
}

export function markResult(
  map: ProgressMap,
  id: string,
  correct: boolean,
): ProgressMap {
  const prev = map[id] ?? emptyProgress()
  const correctCount = correct ? prev.correctCount + 1 : prev.correctCount
  return {
    ...map,
    [id]: {
      ...prev,
      seenCount: Math.max(prev.seenCount, 1),
      correctCount,
      mastered: correct || prev.mastered,
      lastSeen: Date.now(),
    },
  }
}

export function poolStats(ids: string[], map: ProgressMap) {
  let correct = 0
  let seen = 0
  for (const id of ids) {
    const p = map[id]
    if (!p) continue
    if (p.seenCount > 0) seen += 1
    if (p.correctCount > 0 || p.mastered) correct += 1
  }
  return {
    correct,
    seen,
    remaining: Math.max(0, ids.length - seen),
    total: ids.length,
  }
}
