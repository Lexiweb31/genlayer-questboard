import { useState, useEffect, useRef } from 'react'
import { readClient } from './useClient'

export type TxPhase =
  | 'PENDING'
  | 'PROPOSING'
  | 'COMMITTING'
  | 'REVEALING'
  | 'ACCEPTED'
  | 'FINALIZED'
  | 'UNDETERMINED'
  | 'CANCELED'
  | 'VALIDATORS_TIMEOUT'
  | 'LEADER_TIMEOUT'

export interface PollState {
  phase: TxPhase | null
  result: string | null   // 'SUCCESS' | 'FAILURE' | null
  done: boolean
  error: string | null
}

const TERMINAL: TxPhase[] = ['FINALIZED', 'UNDETERMINED', 'CANCELED', 'VALIDATORS_TIMEOUT', 'LEADER_TIMEOUT']

// Poll a tx hash until it reaches a terminal state.
// Returns live phase updates every ~2s.
export function usePollTx(hash: string | null): PollState {
  const [state, setState] = useState<PollState>({ phase: null, result: null, done: false, error: null })
  const stopped = useRef(false)

  useEffect(() => {
    if (!hash) return
    stopped.current = false
    setState({ phase: 'PENDING', result: null, done: false, error: null })

    const poll = async () => {
      while (!stopped.current) {
        try {
          const tx = await readClient.getTransaction({ hash: hash as `0x${string}` & { length: 66 } })
          const phase = (tx.statusName ?? tx.status) as TxPhase
          const result = tx.txExecutionResultName as string ?? null

          const done = TERMINAL.includes(phase)
          setState({ phase, result, done, error: null })

          if (done || stopped.current) break
        } catch (e) {
          setState(s => ({ ...s, error: String(e) }))
        }
        await new Promise(r => setTimeout(r, 2000))
      }
    }

    poll()
    return () => { stopped.current = true }
  }, [hash])

  return state
}
