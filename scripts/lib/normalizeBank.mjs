/**
 * Bank question shape fixes shared by the chunk/bank build pipeline.
 * Does not invent content — only reshapes existing fields.
 */

/** Answer-key style MCQ (exactly one option) → open + self-check. */
export function normalizeQuestion(q) {
  if (q.type !== 'multiple_choice') return { question: q, converted: false }
  const opts = q.options ?? []
  if (opts.length !== 1) return { question: q, converted: false }

  const answer = opts[0]?.text ?? ''
  const next = { ...q, type: 'open', answer, mode: 'self_check' }
  delete next.options
  delete next.correctUnknown
  return { question: next, converted: true }
}

function classify(q) {
  if (q.type === 'open') {
    return q.answer && String(q.answer).trim() ? 'open' : 'openNoAnswer'
  }
  if (q.type !== 'multiple_choice') return null
  const opts = q.options ?? []
  if (q.correctUnknown || !opts.some((o) => o.correct === true)) return 'mcqSelfCheck'
  return 'mcqGradable'
}

export function recomputeMeta(bank) {
  const stats = {
    mcqGradable: 0,
    mcqSelfCheck: 0,
    open: 0,
    openNoAnswer: 0,
  }
  const bySource = new Map()

  for (const q of bank.questions) {
    const kind = classify(q)
    if (kind === 'open' || kind === 'openNoAnswer') {
      stats.open += 1
      if (kind === 'openNoAnswer') stats.openNoAnswer += 1
    } else if (kind === 'mcqGradable') {
      stats.mcqGradable += 1
    } else if (kind === 'mcqSelfCheck') {
      stats.mcqSelfCheck += 1
    }

    if (!bySource.has(q.source)) {
      bySource.set(q.source, { count: 0, types: {} })
    }
    const entry = bySource.get(q.source)
    entry.count += 1
    entry.types[q.type] = (entry.types[q.type] ?? 0) + 1
  }

  const sources = (bank.meta.sources ?? []).map((s) => {
    const live = bySource.get(s.source) ?? { count: 0, types: {} }
    return { ...s, count: live.count, types: live.types }
  })

  return {
    ...bank.meta,
    total: bank.questions.length,
    stats,
    sources,
  }
}

/** Normalize all questions; returns new bank + conversion count. */
export function normalizeBank(bank) {
  let converted = 0
  const questions = bank.questions.map((q) => {
    const { question, converted: did } = normalizeQuestion(q)
    if (did) converted += 1
    return question
  })
  const next = { ...bank, questions, meta: recomputeMeta({ ...bank, questions }) }
  return { bank: next, converted }
}
