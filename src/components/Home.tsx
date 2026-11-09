import type { BankManifest, ProgressMap } from '../types'
import { displaySourceLabel } from '../lib/quiz'
import { poolStats } from '../lib/progress'

interface Props {
  manifest: BankManifest
  poolIds: string[]
  selected: Set<string> | 'all'
  progress: ProgressMap
  brokenCount: number
  starting?: boolean
  onToggleSource: (source: string) => void
  onSelectAll: () => void
  onStart: () => void
  onReset: () => void
  onClearBroken: () => void
}

export function Home({
  manifest,
  poolIds,
  selected,
  progress,
  brokenCount,
  starting = false,
  onToggleSource,
  onSelectAll,
  onStart,
  onReset,
  onClearBroken,
}: Props) {
  const stats = poolStats(poolIds, progress)
  const pct = stats.total ? Math.round((stats.seen / stats.total) * 100) : 0

  return (
    <div className="screen-enter">
      <header className="brand-block">
        <h1 className="brand">MedTest</h1>
        <p className="brand-sub">
          Случайные вопросы из банка МК — тренировка с локальным прогрессом.
        </p>
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onStart}
            disabled={stats.total === 0 || starting}
          >
            {starting ? 'Загрузка…' : 'Начать практику'}
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
          В пуле {stats.total} вопросов · банк всего {manifest.meta.total}
        </p>
      </section>

      <section className="section" aria-label="Скрытые вопросы">
        <h2 className="section-title">Скрытые</h2>
        <p className="section-note">
          Вопросы, помеченные «Не показывать», исключены из пула на этом
          устройстве (отдельно от прогресса).
        </p>
        <p className="section-note" style={{ marginTop: 8 }}>
          Скрыто: <strong>{brokenCount}</strong>
        </p>
        {brokenCount > 0 && (
          <div className="cta-row" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={onClearBroken}>
              Вернуть скрытые в пул
            </button>
          </div>
        )}
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
              <span>{manifest.meta.total} вопросов</span>
            </span>
          </button>
          {manifest.sources.map((src) => {
            const on = selected !== 'all' && selected.has(src.source)
            return (
              <button
                key={src.source}
                type="button"
                className={`source-item ${on ? 'is-on' : ''}`}
                onClick={() => onToggleSource(src.source)}
              >
                <span className="source-check" aria-hidden />
                <span className="source-text">
                  <strong>{displaySourceLabel(src.source)}</strong>
                  <span>{src.count} вопросов</span>
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <p className="footer-note">
        MCQ с известным ответом проверяются автоматически. Открытые вопросы и
        MCQ без ключа — самопроверка («знал / не знал»). Прогресс и скрытые
        вопросы хранятся только на этом устройстве.
      </p>
    </div>
  )
}
