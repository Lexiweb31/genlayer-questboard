import { useState, useEffect } from 'react'

const BRADBURY_CHAIN_ID = 4221
const BRADBURY_CHAIN_HEX = `0x${BRADBURY_CHAIN_ID.toString(16)}`

const BRADBURY_CHAIN_PARAMS = {
  chainId: BRADBURY_CHAIN_HEX,
  chainName: 'Genlayer Bradbury Testnet',
  rpcUrls: ['https://rpc-bradbury.genlayer.com'],
  nativeCurrency: { name: 'GEN', symbol: 'GEN', decimals: 18 },
}

export async function addBradburyNetwork() {
  const provider = window.ethereum
  if (!provider) return
  // wallet_addEthereumChain handles both "add" and "switch" on all wallets (Rabby, MetaMask, Brave…)
  await provider.request({ method: 'wallet_addEthereumChain', params: [BRADBURY_CHAIN_PARAMS] })
}

export function useChain(address: string | null) {
  const [chainId, setChainId] = useState<number | null>(null)

  useEffect(() => {
    if (!address || !window.ethereum) return

    const readChain = () => {
      ;(window.ethereum!.request({ method: 'eth_chainId' }) as Promise<string>)
        .then(hex => setChainId(parseInt(hex, 16)))
        .catch(() => {})
    }

    readChain()

    const handler = (hex: unknown) => setChainId(parseInt(hex as string, 16))
    const provider = window.ethereum as typeof window.ethereum & { removeListener?: (event: string, handler: unknown) => void }
    provider.on('chainChanged', handler)
    return () => provider.removeListener?.('chainChanged', handler)
  }, [address])

  return {
    chainId,
    isCorrectChain: chainId === null || chainId === BRADBURY_CHAIN_ID,
  }
}
