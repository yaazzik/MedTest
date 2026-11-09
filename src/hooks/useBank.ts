import { useEffect, useState } from 'react'
import type { QuestionBank } from '../types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; bank: QuestionBank }

export function useBank(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/data/bank.json')
        if (!res.ok) throw new Error(`Не удалось загрузить банк (${res.status})`)
        const bank = (await res.json()) as QuestionBank
        if (!cancelled) setState({ status: 'ready', bank })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Ошибка загрузки',
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
