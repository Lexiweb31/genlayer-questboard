import { useState, useEffect } from 'react'

export function useWalletProviders(): EIP6963ProviderDetail[] {
  const [providers, setProviders] = useState<EIP6963ProviderDetail[]>([])

  useEffect(() => {
    const seen = new Map<string, EIP6963ProviderDetail>()

    const onAnnounce = (e: CustomEvent<EIP6963ProviderDetail>) => {
      if (!seen.has(e.detail.info.uuid)) {
        seen.set(e.detail.info.uuid, e.detail)
        setProviders([...seen.values()])
      }
    }

    window.addEventListener('eip6963:announceProvider', onAnnounce)
    window.dispatchEvent(new Event('eip6963:requestProvider'))

    return () => window.removeEventListener('eip6963:announceProvider', onAnnounce)
  }, [])

  return providers
}
