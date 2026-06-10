import { useState, useCallback, useEffect } from 'react'

export interface TxRecord {
  hash: string
  fn: string          // function name called
  label: string       // human-readable description
  timestamp: number
  finalPhase?: string
  finalResult?: string
}

const KEY = 'questboard_tx_history'

function load(): TxRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

function save(records: TxRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(records.slice(0, 50)))
}

export function useTxHistory() {
  const [records, setRecords] = useState<TxRecord[]>(load)

  useEffect(() => { save(records) }, [records])

  const add = useCallback((record: TxRecord) => {
    setRecords(prev => [record, ...prev])
  }, [])

  const update = useCallback((hash: string, patch: Partial<TxRecord>) => {
    setRecords(prev => prev.map(r => r.hash === hash ? { ...r, ...patch } : r))
  }, [])

  const clear = useCallback(() => {
    setRecords([])
  }, [])

  return { records, add, update, clear }
}
