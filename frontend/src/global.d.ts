interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
}

// EIP-6963: Multi Injected Provider Discovery
interface EIP6963ProviderInfo {
  rdns: string
  uuid: string
  name: string
  icon: string // data URI
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EthereumProvider
}

interface WindowEventMap {
  'eip6963:announceProvider': CustomEvent<EIP6963ProviderDetail>
}

interface Window {
  ethereum?: EthereumProvider
}
