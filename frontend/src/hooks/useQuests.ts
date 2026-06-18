import { useState, useEffect, useCallback } from 'react'
import { readClient } from './useClient'
import { CONTRACT_ADDRESS } from '../config'
import type { Quest, Submission } from '../types'

type ReadArgs = NonNullable<Parameters<typeof readClient.readContract>[0]['args']>

async function read<T>(functionName: string, args: ReadArgs = []): Promise<T> {
  return readClient.readContract({
    address: CONTRACT_ADDRESS as `0x${string}`,
    functionName,
    args,
  }) as Promise<T>
}

export function useActiveQuests() {
  const [quests, setQuests]   = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await read<Quest[]>('get_active_quests')
      // Sort newest first
      setQuests([...data].sort((a, b) => b.id - a.id))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const timer = setInterval(refresh, 30_000)
    const onEvent = () => refresh()
    window.addEventListener('questboard:refresh', onEvent)
    return () => { clearInterval(timer); window.removeEventListener('questboard:refresh', onEvent) }
  }, [refresh])

  return { quests, loading, error, refresh }
}

export function useAllQuests() {
  const [quests, setQuests]   = useState<Quest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await read<Quest[]>('get_all_quests')
      setQuests([...data].sort((a, b) => b.id - a.id))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Auto-refresh every 30s and on quest change events
  useEffect(() => {
    const timer = setInterval(refresh, 30_000)
    const onEvent = () => refresh()
    window.addEventListener('questboard:refresh', onEvent)
    return () => { clearInterval(timer); window.removeEventListener('questboard:refresh', onEvent) }
  }, [refresh])

  return { quests, loading, error, refresh }
}

export function useQuest(questId: number | null) {
  const [quest, setQuest]     = useState<Quest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (questId === null) return
    setLoading(true)
    setError(null)
    try {
      const data = await read<Quest>('get_quest', [questId])
      setQuest(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [questId])

  useEffect(() => { refresh() }, [refresh])

  return { quest, loading, error, refresh }
}

export function useSubmissions(questId: number | null) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (questId === null) return
    setLoading(true)
    setError(null)
    try {
      const data = await read<Submission[]>('get_submissions', [questId])
      setSubmissions(data)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [questId])

  useEffect(() => { refresh() }, [refresh])

  // Auto-poll so submitters see results without refreshing
  useEffect(() => {
    const timer = setInterval(refresh, 15_000)
    const onEvent = () => refresh()
    window.addEventListener('questboard:refresh', onEvent)
    return () => { clearInterval(timer); window.removeEventListener('questboard:refresh', onEvent) }
  }, [refresh])

  return { submissions, loading, error, refresh }
}

export function useMySubmissions(address: string | null, questIds: number[]) {
  const [items, setItems] = useState<{ questId: number; submission: Submission }[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!address || questIds.length === 0) { setItems([]); return }
    setLoading(true)
    try {
      const results = await Promise.all(
        questIds.map(id =>
          read<Submission[]>('get_submissions', [id])
            .then(subs => subs.filter(s => s.submitter.toLowerCase() === address.toLowerCase()).map(s => ({ questId: id, submission: s })))
            .catch(() => [])
        )
      )
      setItems(results.flat())
    } finally {
      setLoading(false)
    }
  }, [address, questIds.join(',')])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const timer = setInterval(refresh, 30_000)
    const onEvent = () => refresh()
    window.addEventListener('questboard:refresh', onEvent)
    return () => { clearInterval(timer); window.removeEventListener('questboard:refresh', onEvent) }
  }, [refresh])

  return { items, loading, refresh }
}

export function useClaimable(address: string | null) {
  const [amount, setAmount]   = useState<bigint>(BigInt(0))
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const data = await read<string>('get_claimable', [address])
      setAmount(BigInt(data))
    } catch {
      setAmount(BigInt(0))
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => { refresh() }, [refresh])

  // Re-poll every 30s and on questboard:refresh so the Claim button appears immediately after payouts
  useEffect(() => {
    if (!address) return
    const timer = setInterval(refresh, 30_000)
    const onEvent = () => refresh()
    window.addEventListener('questboard:refresh', onEvent)
    return () => { clearInterval(timer); window.removeEventListener('questboard:refresh', onEvent) }
  }, [address, refresh])

  return { amount, loading, refresh }
}
