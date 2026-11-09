import type { Question } from '../types'

export function sourceKey(q: Question): string {
  return q.source
}

/** Fisher–Yates shuffle copy */
export function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Draw without immediate repeats until pool exhausted.
 * `queue` is remaining IDs for current cycle; when empty, reshuffle excluding lastId.
 */
export function nextFromQueue(
  poolIds: string[],
  queue: string[],
  lastId: string | null,
): { nextId: string | null; queue: string[] } {
  if (poolIds.length === 0) return { nextId: null, queue: [] }

  let q = [...queue]
  if (q.length === 0) {
    q = shuffle(poolIds)
    if (lastId && q.length > 1 && q[0] === lastId) {
      const swap = 1 + Math.floor(Math.random() * (q.length - 1))
      ;[q[0], q[swap]] = [q[swap], q[0]]
    }
  }

  const nextId = q[0] ?? null
  return { nextId, queue: q.slice(1) }
}

export function isGradableMcq(q: Question): boolean {
  if (q.type !== 'multiple_choice') return false
  const opts = q.options ?? []
  if (opts.length === 0) return false
  if (q.correctUnknown) return false
  return opts.some((o) => o.correct === true)
}

export function displaySourceLabel(source: string): string {
  const map: Record<string, string> = {
    'Otvety_na_testy.docx': 'Ответы на тесты',
    'Testy_po_MK.pdf': 'Тесты по МК',
    'Testy_po_MK-2.docx': 'Тесты по МК (2)',
    'MK_poisk.pdf': 'МК поиск',
    'Medkat.pdf': 'Медкат',
    'Otvety_medkat.pdf': 'Ответы медкат',
    'med_kad_ekzamen0.pdf': 'Экзамен 0',
    'med_kad_ekzamen1.pdf': 'Экзамен 1',
    'med_kad_ekzamen2.pdf': 'Экзамен 2',
  }
  return map[source] ?? source.replace(/\.(pdf|docx)$/i, '')
}
