import { useState, useCallback, useEffect } from 'react'
import { createClient, chains } from 'genlayer-js'
import { NETWORK } from '../config'

const chain = NETWORK === 'testnet' ? chains.testnetBradbury : chains.localnet

// Shared read-only client (no wallet needed)
export const readClient = createClient({ chain })

export type GenLayerWriteClient = ReturnType<typeof createClient>

export function useWallet() {
  const [address, setAddress]         = useState<string | null>(null)
  const [connecting, setConnecting]   = useState(false)
  const [writeClient, setWriteClient] = useState<GenLayerWriteClient | null>(null)

  // Auto-reconnect with the last used provider (window.ethereum, already authorized)
  useEffect(() => {
    if (!window.ethereum) return
    window.ethereum
      .request({ method: 'eth_accounts' })
      .then(raw => {
        const accounts = raw as string[]
        if (accounts.length > 0) connect(window.ethereum!)
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // connect is called with the EIP-1193 provider chosen by the user
  const connect = useCallback(async (provider: EthereumProvider) => {
    setConnecting(true)
    try {
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      if (!accounts?.length) throw new Error('No accounts returned')
      const client = createClient({ chain, provider })
      await client.connect()
      setAddress(accounts[0])
      setWriteClient(client)
    } catch (err) {
      console.error('Wallet connect failed:', err)
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setWriteClient(null)
  }, [])

  return { address, connecting, writeClient, connect, disconnect }
}
