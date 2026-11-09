import type { ProgressMap, Question, QuestionBank } from '../types'
import { displaySourceLabel } from '../lib/quiz'
import { poolStats } from '../lib/progress'

interface Props {
  bank: QuestionBank
  questions: Question[]
  selected: Set<string> | 'all'
  progress: ProgressMap
  onToggleSource: (source: string) => void
  onSelectAll: () => void
  onStart: () => void
  onReset: () => void
}

export function Home({
  bank,
  questions,
  selected,
  progress,
  onToggleSource,
  onSelectAll,
  onStart,
  onReset,
}: Props) {
  const ids = questions.map((q) => q.id)
  const stats = poolStats(ids, progress)
  const pct = stats.total ? Math.round((stats.seen / stats.total) * 100) : 0
  const uniqueSources = [...new Set(bank.questions.map((q) => q.source))]

  return (
    <div className="screen-enter">
      <header className="brand-block">
        <h1 className="brand">MedTest</h1>
        <p className="brand-sub">
          Случайные вопросы из банка МК — тренировка с локальным прогрессом.
        </p>
        <div className="cta-row">
          <button type="button" className="btn btn-primary" onClick={onStart} disabled={stats.total === 0}>
            Начать практику
          </button>
          <button type="button" className="btn btn-secondary" onClick={onReset}>
            Сбросить прогресс
          </button>
        </div>
      </header>

      <section className="section" aria-label="Прогресс">
        <h2 className="section-title">Прогресс</h2>
        <p className="section-note">
          По выбранному пулу: верно / просмотрено / осталось.
        </p>
        <div className="stats-row">
          <div className="stat">
            <b>{stats.correct}</b>
            <span>верно</span>
          </div>
          <div className="stat">
            <b>{stats.seen}</b>
            <span>просмотрено</span>
          </div>
          <div className="stat">
            <b>{stats.remaining}</b>
            <span>осталось</span>
          </div>
        </div>
        <div className="progress-track" aria-hidden>
          <div className="progress-fill" style={{ transform: `scaleX(${pct / 100 || 0.02})` }} />
        </div>
        <p className="section-note" style={{ marginTop: 10 }}>
          В пуле {stats.total} вопросов · банк всего {bank.meta.total}
        </p>
      </section>

      <section className="section" aria-label="Источники">
        <h2 className="section-title">Источники</h2>
        <p className="section-note">Выберите один или несколько банков, либо все.</p>
        <div className="source-list">
          <button
            type="button"
            className={`source-item ${selected === 'all' ? 'is-on' : ''}`}
            onClick={onSelectAll}
          >
            <span className="source-check" aria-hidden />
            <span className="source-text">
              <strong>Все источники</strong>
              <span>{bank.meta.total} вопросов</span>
            </span>
          </button>
          {uniqueSources.map((src) => {
            const count = bank.questions.filter((q) => q.source === src).length
            const on = selected !== 'all' && selected.has(src)
            return (
              <button
                key={src}
                type="button"
                className={`source-item ${on ? 'is-on' : ''}`}
                onClick={() => onToggleSource(src)}
              >
                <span className="source-check" aria-hidden />
                <span className="source-text">
                  <strong>{displaySourceLabel(src)}</strong>
                  <span>{count} вопросов</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <p className="footer-note">
        MCQ с известным ответом проверяются автоматически. Открытые вопросы и
        MCQ без ключа — самопроверка («знал / не знал»). Прогресс хранится только
        на этом устройстве.
      </p>
    </div>
  )
}
