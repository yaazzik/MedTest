import { startTransition, useEffect, useRef, useState } from 'react'
import { Home } from './components/Home'
import { Quiz } from './components/Quiz'
import { useBank } from './hooks/useBank'
import {
  clearProgress,
  emptyProgress,
  loadProgress,
  markResult,
  saveProgress,
} from './lib/progress'
import { filterPool, nextFromQueue } from './lib/quiz'
import type { ProgressMap, Screen } from './types'

export default function App() {
  const bankState = useBank()
  const [screen, setScreen] = useState<Screen>('home')
  const [selected, setSelected] = useState<Set<string> | 'all'>('all')
  const [progress, setProgress] = useState<ProgressMap>({})
  const [queue, setQueue] = useState<string[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
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
          <p>Загружаем банк вопросов…</p>
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

  const { bank } = bankState
  const pool = filterPool(bank.questions, selected)
  const byId = new Map(bank.questions.map((q) => [q.id, q]))
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

  function startQuiz() {
    const ids = pool.map((q) => q.id)
    const draw = nextFromQueue(ids, [], null)
    setQueue(draw.queue)
    setCurrentId(draw.nextId)
    setScreen('quiz')
  }

  function goNext() {
    const ids = pool.map((q) => q.id)
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
        <Home
          bank={bank}
          questions={pool}
          selected={selected}
          progress={progress}
          onToggleSource={toggleSource}
          onSelectAll={selectAll}
          onStart={startQuiz}
          onReset={resetProgress}
        />
      )}

      {screen === 'quiz' && current && (
        <Quiz
          key={current.id}
          question={current}
          indexHint={`${pool.length} в пуле`}
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
