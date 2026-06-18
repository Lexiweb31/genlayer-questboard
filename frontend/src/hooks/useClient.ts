import { useState, useCallback, useEffect } from 'react'
import { createClient, chains } from 'genlayer-js'
import { NETWORK } from '../config'

const chain = NETWORK === 'testnet' ? chains.testnetBradbury : chains.localnet

// Read-only client — no wallet needed
export const readClient = createClient({ chain })

export type GenLayerWriteClient = ReturnType<typeof createClient>

// Add the GenLayer chain to the wallet, then switch to it.
// Uses the chosen provider directly — never touches window.ethereum.
async function ensureChain(provider: EthereumProvider) {
  const chainIdHex = `0x${chain.id.toString(16)}`
  try {
    const current = await provider.request({ method: 'eth_chainId' }) as string
    if (current.toLowerCase() === chainIdHex.toLowerCase()) return
    // wallet_addEthereumChain handles both add + switch on MetaMask, Rabby, Brave, etc.
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: chainIdHex,
        chainName: chain.name,
        rpcUrls: chain.rpcUrls.default.http,
        nativeCurrency: chain.nativeCurrency,
      }],
    })
  } catch (err) {
    console.warn('GenLayer chain switch failed:', err)
  }
}

export function useWallet() {
  const [address, setAddress]         = useState<string | null>(null)
  const [connecting, setConnecting]   = useState(false)
  const [writeClient, setWriteClient] = useState<GenLayerWriteClient | null>(null)

  // Auto-reconnect if the user was already authorized (e.g. page refresh)
  useEffect(() => {
    if (!window.ethereum) return
    ;(window.ethereum.request({ method: 'eth_accounts' }) as Promise<string[]>)
      .then(accounts => { if (accounts.length > 0) connect(window.ethereum!) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const connect = useCallback(async (provider: EthereumProvider) => {
    setConnecting(true)
    try {
      // 1. Request wallet access
      const accounts = await provider.request({ method: 'eth_requestAccounts' }) as string[]
      if (!accounts?.length) throw new Error('Wallet returned no accounts')

      // 2. Switch wallet to the GenLayer chain (adds it if missing)
      await ensureChain(provider)

      // 3. Build a genlayer write client — pass account so viem knows which address signs
      //    Do NOT call client.connect() — it hardcodes window.ethereum & tries to install a MetaMask snap
      const client = createClient({ chain, provider, account: accounts[0] as `0x${string}` })

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
