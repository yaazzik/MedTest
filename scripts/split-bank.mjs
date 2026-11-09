#!/usr/bin/env node
/**
 * Transform data/bank.json into:
 *   - public/data/manifest.json (tiny index + question ids)
 *   - public/data/chunks/<slug>.json (questions per source)
 *
 * Does not invent questions — only partitions the existing bank.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const BANK_PATH = path.join(ROOT, 'data/bank.json')
const CHUNKS_DIR = path.join(ROOT, 'public/data/chunks')
const MANIFEST_PATH = path.join(ROOT, 'public/data/manifest.json')

function slugFromSource(source) {
  return source.replace(/\.(pdf|docx)$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '_')
}

const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'))
fs.mkdirSync(CHUNKS_DIR, { recursive: true })

const bySource = new Map()
for (const q of bank.questions) {
  if (!bySource.has(q.source)) bySource.set(q.source, [])
  bySource.get(q.source).push(q)
}

const sources = []
for (const meta of bank.meta.sources) {
  const questions = bySource.get(meta.source) ?? []
  const slug = slugFromSource(meta.source)
  const chunkFile = `${slug}.json`
  const chunkPath = path.join(CHUNKS_DIR, chunkFile)
  fs.writeFileSync(chunkPath, JSON.stringify({ source: meta.source, questions }))
  const size = fs.statSync(chunkPath).size
  sources.push({
    id: meta.source,
    label: meta.label,
    source: meta.source,
    count: questions.length,
    types: meta.types,
    chunk: `chunks/${chunkFile}`,
    questionIds: questions.map((q) => q.id),
  })
  console.log(`${chunkFile}\t${questions.length}\t${(size / 1024).toFixed(1)} KB`)
}

const manifest = {
  meta: {
    title: bank.meta.title,
    total: bank.meta.total,
    skippedEmptyQuestions: bank.meta.skippedEmptyQuestions,
    stats: bank.meta.stats,
  },
  sources,
}
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest))

const bankIds = new Set(bank.questions.map((q) => q.id))
const chunkIds = new Set(sources.flatMap((s) => s.questionIds))
const parity =
  bankIds.size === chunkIds.size && [...bankIds].every((id) => chunkIds.has(id))
if (!parity) {
  console.error('ERROR: question id parity failed')
  process.exit(1)
}

console.log(
  `\nmanifest.json ${(fs.statSync(MANIFEST_PATH).size / 1024).toFixed(1)} KB`,
)
console.log(`sources ${sources.length} · ids ${chunkIds.size} · parity ok`)
