import { useEffect } from 'react'
import { readClient } from './useClient'
import type { TxRecord } from './useTxHistory'

const TERMINAL = ['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED', 'VALIDATORS_TIMEOUT', 'LEADER_TIMEOUT']

// Polls all un-finalized transactions in the background and persists their final phase.
// Works even when the TxHistoryPanel is closed.
export function usePendingWatcher(
  records: TxRecord[],
  update: (hash: string, patch: Partial<TxRecord>) => void,
  onFinalized?: (record: TxRecord, phase: string) => void,
) {
  const pendingKey = records
    .filter(r => !r.finalPhase && r.hash)
    .map(r => r.hash)
    .join(',')

  useEffect(() => {
    if (!pendingKey) return
    const pending = records.filter(r => !r.finalPhase && r.hash)
    const aborted = new Set<string>()

    pending.forEach(async record => {
      while (!aborted.has(record.hash)) {
        try {
          const tx = await readClient.getTransaction({
            hash: record.hash as `0x${string}` & { length: 66 },
          })
          const phase = (tx as { statusName?: string; status?: string }).statusName
                     ?? (tx as { statusName?: string; status?: string }).status
                     ?? ''
          if (TERMINAL.includes(phase)) {
            if (!aborted.has(record.hash)) {
              update(record.hash, { finalPhase: phase })
              onFinalized?.(record, phase)
            }
            break
          }
        } catch { /* network blip — retry next interval */ }
        await new Promise(r => setTimeout(r, 4000))
      }
    })

    return () => pending.forEach(r => aborted.add(r.hash))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingKey])
}
