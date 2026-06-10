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

  return { quests, loading, error, refresh }
}

export function useQuest(questId: number | null) {
  const [quest, setQuest]     = useState<Quest | null>(null)
  const [loading, setLoading] = useState(false)
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

  return { submissions, loading, error, refresh }
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

  return { amount, loading, refresh }
}
