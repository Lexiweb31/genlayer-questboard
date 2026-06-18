import { useState, useCallback } from 'react'
import { CONTRACT_ADDRESS } from '../config'
import type { TxStatus } from '../types'

const BRADBURY_CHAIN_ID = 4221
const BRADBURY_CHAIN_HEX = `0x${BRADBURY_CHAIN_ID.toString(16)}`

async function ensureBradbury() {
  const provider = window.ethereum
  if (!provider) return
  try {
    const current = await provider.request({ method: 'eth_chainId' }) as string
    if (current.toLowerCase() === BRADBURY_CHAIN_HEX.toLowerCase()) return
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: BRADBURY_CHAIN_HEX,
        chainName: 'Genlayer Bradbury Testnet',
        rpcUrls: ['https://rpc-bradbury.genlayer.com'],
        nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
      }],
    })
  } catch { /* ignore — transaction will surface the error */ }
}

type WriteClient = {
  writeContract: (args: {
    address: string
    functionName: string
    args?: unknown[]
    value: bigint
  }) => Promise<string>
  waitForTransactionReceipt: (args: {
    hash: string
    interval?: number
    retries?: number
  }) => Promise<{ txExecutionResultName?: string }>
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
      await ensureBradbury()
      const hash = await writeClient.writeContract({
        address: CONTRACT_ADDRESS,
        functionName,
        args,
        value: value ?? BigInt(0),
      })
      setTxHash(hash)

      // Bradbury consensus takes 1-3 min; poll every 5s for up to 4 minutes
      const receipt = await writeClient.waitForTransactionReceipt({ hash, interval: 5000, retries: 48 })

      if (receipt.txExecutionResultName === 'FINISHED_WITH_ERROR') {
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
      await ensureBradbury()
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

export function formatGEN(wei: string | number | bigint): string {
  const n = typeof wei === 'string' ? BigInt(wei) : typeof wei === 'number' ? BigInt(Math.floor(wei)) : wei
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

/** Returns the user's chosen nickname if they set one on this device, otherwise shortAddr. */
export function displayName(addr: string | null | undefined): string {
  if (!addr) return ''
  const stored = localStorage.getItem(`qb-username-${addr.toLowerCase()}`)
  return stored || shortAddr(addr)
}
