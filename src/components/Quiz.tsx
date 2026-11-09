import { useState } from 'react'
import type { Question } from '../types'
import { displaySourceLabel, isGradableMcq } from '../lib/quiz'

interface Props {
  question: Question
  indexHint: string
  onBack: () => void
  onNext: () => void
  onGraded: (correct: boolean) => void
}

export function Quiz({ question, indexHint, onBack, onNext, onGraded }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [draft, setDraft] = useState('')
  const [marked, setMarked] = useState<null | boolean>(null)

  const gradable = isGradableMcq(question)
  const options = question.options ?? []
  const selfCheck = question.type === 'open' || !gradable

  function pickOption(id: string) {
    if (revealed || marked !== null) return
    setSelected(id)
    if (gradable) {
      setRevealed(true)
      const opt = options.find((o) => o.id === id)
      onGraded(Boolean(opt?.correct))
    }
  }

  function revealOpen() {
    setRevealed(true)
  }

  function markSelf(correct: boolean) {
    if (marked !== null) return
    setMarked(correct)
    onGraded(correct)
  }

  const canSelfMark =
    selfCheck &&
    marked === null &&
    ((question.type === 'open' && revealed) ||
      (question.type === 'multiple_choice' && selected !== null))

  const canNext =
    marked !== null || (gradable && revealed) || (selfCheck && marked !== null)

  return (
    <div className="screen-enter">
      <div className="quiz-top">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← На главную
        </button>
        <span className="pill-meta">{indexHint}</span>
      </div>

      <article className="question-panel">
        <p className="q-kicker">
          {displaySourceLabel(question.source)}
          {question.section ? ` · ${question.section}` : ''}
          {question.kind === 'definition' ? ' · определение' : ''}
          {question.type === 'multiple_choice' ? ' · выбор' : ' · открытый'}
        </p>
        <h2 className="q-text">{question.question}</h2>

        {question.type === 'multiple_choice' && !gradable && (
          <div className="status-banner">
            Ключ ответа неизвестен — режим самопроверки.
          </div>
        )}

        {question.type === 'multiple_choice' && (
          <div className="options" role="listbox" aria-label="Варианты ответа">
            {options.length === 0 && (
              <div className="status-banner">У вопроса нет вариантов ответа.</div>
            )}
            {options.map((opt) => {
              let cls = 'option'
              if (selected === opt.id) cls += ' is-selected'
              if (revealed && gradable) {
                if (opt.correct) cls += ' is-correct'
                else if (selected === opt.id) cls += ' is-wrong'
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cls}
                  disabled={revealed || marked !== null}
                  onClick={() => pickOption(opt.id)}
                >
                  <span className="option-letter">{opt.id.toUpperCase()}</span>
                  <span className="option-text">{opt.text}</span>
                </button>
              )
            })}
          </div>
        )}

        {question.type === 'open' && (
          <>
            <textarea
              className="answer-box"
              placeholder="Введите свой ответ…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              disabled={revealed}
            />
            {revealed && (
              <div className="reveal">
                <strong>Эталонный ответ</strong>
                <p>
                  {(question.answer || '').trim() ||
                    'Ответ в банке отсутствует — оцените сами по памяти.'}
                </p>
              </div>
            )}
          </>
        )}

        {gradable && revealed && selected && (
          <div
            className={`feedback ${
              options.find((o) => o.id === selected)?.correct ? 'ok' : 'bad'
            }`}
          >
            {options.find((o) => o.id === selected)?.correct ? 'Верно' : 'Неверно'}
          </div>
        )}

        {canSelfMark && (
          <div className="actions">
            <p className="section-note" style={{ marginBottom: 0 }}>
              Отметьте результат:
            </p>
            <div className="actions-row">
              <button type="button" className="btn btn-primary" onClick={() => markSelf(true)}>
                Знал
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => markSelf(false)}>
                Не знал
              </button>
            </div>
          </div>
        )}

        {marked !== null && (
          <div className={`feedback ${marked ? 'ok' : 'bad'}`}>
            {marked ? 'Отмечено как верно' : 'Отмечено как неверно'}
          </div>
        )}

        <div className="actions">
          {question.type === 'open' && !revealed && (
            <button type="button" className="btn btn-primary" onClick={revealOpen}>
              Проверить
            </button>
          )}
          {canNext && (
            <button type="button" className="btn btn-primary" onClick={onNext}>
              Следующий вопрос
            </button>
          )}
        </div>
      </article>
    </div>
  )
}
