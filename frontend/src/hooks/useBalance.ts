import { useEffect, useState, useCallback } from 'react'
import { formatGEN } from './useTx'

const RPC = 'https://rpc-bradbury.genlayer.com'
let _reqId = 1

async function fetchBalance(address: string): Promise<bigint> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: _reqId++, method: 'eth_getBalance', params: [address, 'latest'] }),
  })
  const { result } = await res.json()
  return BigInt(result)
}

export function useBalance(address: string | null) {
  const [balance, setBalance] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!address) { setBalance(null); return }
    setLoading(true)
    try {
      const wei = await fetchBalance(address)
      setBalance(formatGEN(wei))
    } catch {
      setBalance(null)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, 30_000)
    return () => clearInterval(id)
  }, [refresh])

  return { balance, loading, refresh }
}
