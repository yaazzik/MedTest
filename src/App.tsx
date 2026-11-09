import { startTransition, useEffect, useRef, useState } from 'react'
import { Home } from './components/Home'
import { Quiz } from './components/Quiz'
import { useBank } from './hooks/useBank'
import { loadQuestionsFor, poolIds as idsForSelection } from './lib/bankCache'
import {
  clearProgress,
  emptyProgress,
  loadProgress,
  markResult,
  saveProgress,
} from './lib/progress'
import { nextFromQueue } from './lib/quiz'
import type { ProgressMap, Question, Screen } from './types'

export default function App() {
  const bankState = useBank()
  const [screen, setScreen] = useState<Screen>('home')
  const [selected, setSelected] = useState<Set<string> | 'all'>('all')
  const [progress, setProgress] = useState<ProgressMap>({})
  const [queue, setQueue] = useState<string[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [starting, setStarting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const lastSeenId = useRef<string | null>(null)

  useEffect(() => {
    setProgress(loadProgress())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveProgress(progress)
  }, [progress, ready])

  // Count as seen when a question is shown in quiz (once per currentId)
  useEffect(() => {
    if (screen !== 'quiz' || !currentId) return
    if (lastSeenId.current === currentId) return
    lastSeenId.current = currentId
    setProgress((prev) => {
      const cur = prev[currentId] ?? emptyProgress()
      return {
        ...prev,
        [currentId]: {
          ...cur,
          seenCount: cur.seenCount + 1,
          lastSeen: Date.now(),
        },
      }
    })
  }, [screen, currentId])

  if (bankState.status === 'loading' || !ready) {
    return (
      <div className="app-shell">
        <div className="loading">
          <h1>MedTest</h1>
          <p>Загружаем каталог…</p>
        </div>
      </div>
    )
  }

  if (bankState.status === 'error') {
    return (
      <div className="app-shell">
        <div className="error">
          <h1>MedTest</h1>
          <p>{bankState.message}</p>
        </div>
      </div>
    )
  }

  const { manifest } = bankState
  const poolIdList = idsForSelection(manifest, selected)
  const byId = new Map(questions.map((q) => [q.id, q]))
  const current = currentId ? byId.get(currentId) : undefined

  function toggleSource(source: string) {
    startTransition(() => {
      setSelected((prev) => {
        const next = new Set(prev === 'all' ? [] : prev)
        if (next.has(source)) next.delete(source)
        else next.add(source)
        if (next.size === 0) return 'all'
        return next
      })
    })
  }

  function selectAll() {
    startTransition(() => setSelected('all'))
  }

  async function startQuiz() {
    setLoadError(null)
    setStarting(true)
    try {
      const loaded = await loadQuestionsFor(manifest, selected)
      const ids = loaded.map((q) => q.id)
      const draw = nextFromQueue(ids, [], null)
      setQuestions(loaded)
      setQueue(draw.queue)
      setCurrentId(draw.nextId)
      setScreen('quiz')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Ошибка загрузки вопросов')
    } finally {
      setStarting(false)
    }
  }

  function goNext() {
    const ids = questions.map((q) => q.id)
    const draw = nextFromQueue(ids, queue, currentId)
    setQueue(draw.queue)
    setCurrentId(draw.nextId)
  }

  function resetProgress() {
    if (!window.confirm('Сбросить весь локальный прогресс?')) return
    clearProgress()
    setProgress({})
  }

  return (
    <div className="app-shell">
      {screen === 'home' && (
        <>
          <Home
            manifest={manifest}
            poolIds={poolIdList}
            selected={selected}
            progress={progress}
            starting={starting}
            onToggleSource={toggleSource}
            onSelectAll={selectAll}
            onStart={() => void startQuiz()}
            onReset={resetProgress}
          />
          {loadError && (
            <p className="footer-note" role="alert" style={{ color: 'var(--danger, #b00020)' }}>
              {loadError}
            </p>
          )}
        </>
      )}

      {screen === 'quiz' && current && (
        <Quiz
          key={current.id}
          question={current}
          indexHint={`${questions.length} в пуле`}
          onBack={() => setScreen('home')}
          onNext={goNext}
          onGraded={(correct) =>
            setProgress((p) => markResult(p, current.id, correct))
          }
        />
      )}

      {screen === 'quiz' && !current && (
        <div className="error">
          <h1>MedTest</h1>
          <p>В выбранном пуле нет вопросов.</p>
          <button type="button" className="btn btn-primary" onClick={() => setScreen('home')}>
            На главную
          </button>
        </div>
      )}
    </div>
  )
}
