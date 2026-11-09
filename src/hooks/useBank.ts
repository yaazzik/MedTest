import { useEffect, useState } from 'react'
import { DATA_ROOT } from '../lib/dataRoot'
import type { BankManifest } from '../types'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; manifest: BankManifest }

/** First paint: tiny manifest only. Question chunks load on demand. */
export function useBank(): State {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`${DATA_ROOT}/manifest.json`)
        if (!res.ok) throw new Error(`Не удалось загрузить манифест (${res.status})`)
        const manifest = (await res.json()) as BankManifest
        if (!cancelled) setState({ status: 'ready', manifest })
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
