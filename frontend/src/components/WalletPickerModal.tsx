import { useWalletProviders } from '../hooks/useWalletProviders'

interface Props {
  onSelect: (provider: EthereumProvider) => void
  onClose: () => void
}

export function WalletPickerModal({ onSelect, onClose }: Props) {
  const eip6963 = useWalletProviders()

  // Legacy fallback: window.ethereum that didn't announce via EIP-6963
  const legacyProvider =
    window.ethereum && !eip6963.some(p => p.provider === window.ethereum)
      ? window.ethereum
      : null

  const total = eip6963.length + (legacyProvider ? 1 : 0)

  const pick = (provider: EthereumProvider) => {
    onSelect(provider)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative card w-full max-w-sm z-10 shadow-2xl border-quest-purple/40">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Connect Wallet</h2>
            <p className="text-xs text-quest-muted mt-0.5">Choose an EVM wallet</p>
          </div>
          <button className="text-quest-muted hover:text-white transition-colors text-sm" onClick={onClose}>✕</button>
        </div>

        {total === 0 ? (
          <NoWalletState />
        ) : (
          <div className="space-y-2">
            {eip6963.map(detail => (
              <WalletRow
                key={detail.info.uuid}
                name={detail.info.name}
                icon={detail.info.icon}
                onPick={() => pick(detail.provider)}
              />
            ))}
            {legacyProvider && (
              <WalletRow
                name="Browser Wallet"
                icon=""
                emoji="🌐"
                onPick={() => pick(legacyProvider)}
              />
            )}
          </div>
        )}

        <p className="text-xs text-quest-muted text-center mt-5">
          Only the wallet you pick will be used. Your keys stay in your wallet.
        </p>
      </div>
    </div>
  )
}

function WalletRow({
  name, icon, emoji, onPick,
}: {
  name: string; icon: string; emoji?: string; onPick: () => void
}) {
  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-quest-border hover:border-quest-purple hover:bg-quest-purple/5 transition-all text-left group"
      onClick={onPick}
    >
      <div className="w-10 h-10 rounded-xl border border-quest-border bg-quest-surface flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-quest-purple/40 transition-colors">
        {icon
          ? <img src={icon} alt={name} className="w-8 h-8 object-contain" />
          : <span className="text-xl">{emoji}</span>
        }
      </div>
      <span className="text-white font-medium flex-1">{name}</span>
      <span className="text-quest-muted text-xs">→</span>
    </button>
  )
}

function NoWalletState() {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="text-4xl">🦺</div>
      <div>
        <p className="text-white font-semibold mb-1">No EVM wallet detected</p>
        <p className="text-quest-muted text-sm">Install one of these to continue:</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {[
          { name: 'Rabby', url: 'https://rabby.io' },
          { name: 'MetaMask', url: 'https://metamask.io' },
          { name: 'Coinbase Wallet', url: 'https://www.coinbase.com/wallet' },
          { name: 'Rainbow', url: 'https://rainbow.me' },
        ].map(w => (
          <a
            key={w.name}
            href={w.url}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-quest-border rounded-lg px-3 py-2 text-quest-muted hover:text-white hover:border-quest-purple transition-all text-center"
          >
            {w.name}
          </a>
        ))}
      </div>
    </div>
  )
}
