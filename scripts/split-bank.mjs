#!/usr/bin/env node
/**
 * Transform data/bank.json into:
 *   - data/bank.json (normalized in place)
 *   - public/data/manifest.json (tiny index + question ids)
 *   - public/data/chunks/<slug>.json (questions per source)
 *
 * Does not invent questions — only partitions / reshapes the existing bank.
 */
import fs from 'node:fs'
import path from 'node:path'
import { normalizeBank } from './lib/normalizeBank.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const BANK_PATH = path.join(ROOT, 'data/bank.json')
const CHUNKS_DIR = path.join(ROOT, 'public/data/chunks')
const MANIFEST_PATH = path.join(ROOT, 'public/data/manifest.json')

function slugFromSource(source) {
  return source.replace(/\.(pdf|docx)$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '_')
}

const raw = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'))
const { bank, converted } = normalizeBank(raw)
fs.writeFileSync(BANK_PATH, JSON.stringify(bank))
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

const leftoverSingle = bank.questions.filter(
  (q) => q.type === 'multiple_choice' && (q.options ?? []).length === 1,
).length
if (leftoverSingle > 0) {
  console.error(`ERROR: ${leftoverSingle} single-option MCQ remain`)
  process.exit(1)
}

console.log(
  `\nmanifest.json ${(fs.statSync(MANIFEST_PATH).size / 1024).toFixed(1)} KB`,
)
console.log(
  `sources ${sources.length} · ids ${chunkIds.size} · converted ${converted} single-option MCQ→open · parity ok`,
)
