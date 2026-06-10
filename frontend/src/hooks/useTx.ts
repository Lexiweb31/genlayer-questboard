import { useState, useCallback } from 'react'
import { CONTRACT_ADDRESS } from '../config'
import type { TxStatus } from '../types'

type WriteClient = {
  writeContract: (args: {
    address: string
    functionName: string
    args?: unknown[]
    value: bigint
  }) => Promise<string>
  waitForTransactionReceipt: (args: { hash: string }) => Promise<{ txExecutionResultName?: string }>
}

export interface TxResult {
  hash: string | null
  status: TxStatus
  error: string | null
}

export function useTx(writeClient: WriteClient | null) {
  const [status, setStatus] = useState<TxStatus>('idle')
  const [error, setError]   = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const send = useCallback(async (
    functionName: string,
    args: unknown[],
    value?: bigint,
  ): Promise<unknown> => {
    if (!writeClient) throw new Error('Wallet not connected')

    setStatus('pending')
    setError(null)
    setTxHash(null)

    try {
      const hash = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: value ?? BigInt(0),
      })
      setTxHash(hash)

      const receipt = await writeClient.waitForTransactionReceipt({ hash })

      if (receipt.txExecutionResultName && receipt.txExecutionResultName !== 'SUCCESS') {
        throw new Error(`Transaction failed: ${receipt.txExecutionResultName}`)
      }

      setStatus('success')
      return receipt
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStatus('error')
      throw e
    }
  }, [writeClient])

  // Send but don't wait for receipt — returns hash immediately so ConsensusTracker can poll
  const sendAsync = useCallback(async (
    functionName: string,
    args: unknown[],
    value?: bigint,
  ): Promise<string> => {
    if (!writeClient) throw new Error('Wallet not connected')

    setStatus('pending')
    setError(null)
    setTxHash(null)

    try {
      const hash = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: value ?? BigInt(0),
      })
      setTxHash(hash)
      setStatus('success')
      return hash
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(msg)
      setStatus('error')
      throw e
    }
  }, [writeClient])

  const reset = useCallback(() => {
    setStatus('idle')
    setError(null)
    setTxHash(null)
  }, [])

  return { send, sendAsync, status, error, txHash, reset }
}

export function formatGEN(wei: string | bigint): string {
  const n = typeof wei === 'string' ? BigInt(wei) : wei
  const gen = Number(n) / 1e18
  return gen.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 4 })
}

export function parseGEN(gen: string): bigint {
  const f = parseFloat(gen)
  if (isNaN(f) || f <= 0) throw new Error('Invalid GEN amount')
  return BigInt(Math.floor(f * 1e18))
}

export function shortAddr(addr: string): string {
  if (!addr || addr.length < 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
