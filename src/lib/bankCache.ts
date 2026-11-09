import type { BankManifest, ChunkPayload, ManifestSource, Question } from '../types'

const DATA_ROOT = '/data'

const chunkCache = new Map<string, Question[]>()
const inflight = new Map<string, Promise<Question[]>>()

export function selectedSources(
  manifest: BankManifest,
  selected: Set<string> | 'all',
): ManifestSource[] {
  if (selected === 'all') return manifest.sources
  return manifest.sources.filter((s) => selected.has(s.source))
}

export function poolIds(
  manifest: BankManifest,
  selected: Set<string> | 'all',
): string[] {
  return selectedSources(manifest, selected).flatMap((s) => s.questionIds)
}

async function fetchChunk(src: ManifestSource): Promise<Question[]> {
  const cached = chunkCache.get(src.chunk)
  if (cached) return cached

  const pending = inflight.get(src.chunk)
  if (pending) return pending

  const promise = (async () => {
    const res = await fetch(`${DATA_ROOT}/${src.chunk}`)
    if (!res.ok) {
      throw new Error(`Не удалось загрузить ${src.source} (${res.status})`)
    }
    const payload = (await res.json()) as ChunkPayload
    const questions = payload.questions ?? []
    chunkCache.set(src.chunk, questions)
    inflight.delete(src.chunk)
    return questions
  })()

  inflight.set(src.chunk, promise)
  try {
    return await promise
  } catch (err) {
    inflight.delete(src.chunk)
    throw err
  }
}

/** Load and merge questions for the selected sources (memory-cached). */
export async function loadQuestionsFor(
  manifest: BankManifest,
  selected: Set<string> | 'all',
): Promise<Question[]> {
  const sources = selectedSources(manifest, selected)
  const chunks = await Promise.all(sources.map(fetchChunk))
  return chunks.flat()
}

export function clearBankCache(): void {
  chunkCache.clear()
  inflight.clear()
}
