import { useWalletProviders } from '../hooks/useWalletProviders'

interface Props {
  onSelect: (provider: EthereumProvider) => void
  onClose: () => void
}

export function WalletPickerModal({ onSelect, onClose }: Props) {
  const eip6963 = useWalletProviders()

  const legacyProvider =
    window.ethereum && !eip6963.some(p => p.provider === window.ethereum)
      ? window.ethereum
      : null

  const total = eip6963.length + (legacyProvider ? 1 : 0)

  const pick = (provider: EthereumProvider) => { onSelect(provider); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-quest-card border border-quest-border rounded-2xl w-full max-w-sm shadow-2xl z-10 overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-quest-border">
          <div>
            <h2 className="text-base font-semibold text-q-text">Connect Wallet</h2>
            <p className="text-xs text-quest-muted mt-0.5">Choose an EVM-compatible wallet</p>
          </div>
          <button className="text-quest-muted hover:text-q-text transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-quest-surface" onClick={onClose}>✕</button>
        </div>

        <div className="p-4">
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
                <WalletRow name="Browser Wallet" icon="" emoji="🌐" onPick={() => pick(legacyProvider)} />
              )}
            </div>
          )}
        </div>

        <div className="px-5 pb-5 text-center">
          <p className="text-[11px] text-quest-muted">
            Your keys stay in your wallet. QuestBoard never has access.
          </p>
        </div>
      </div>
    </div>
  )
}

function WalletRow({ name, icon, emoji, onPick }: { name: string; icon: string; emoji?: string; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-quest-border hover:border-quest-purple/50 hover:bg-quest-purple/5 transition-all text-left group"
    >
      <div className="w-9 h-9 rounded-xl bg-quest-surface border border-quest-border flex items-center justify-center flex-shrink-0 overflow-hidden group-hover:border-quest-purple/30 transition-colors">
        {icon ? <img src={icon} alt={name} className="w-7 h-7 object-contain" /> : <span className="text-lg">{emoji}</span>}
      </div>
      <span className="text-sm font-medium text-q-text flex-1">{name}</span>
      <svg className="w-4 h-4 text-quest-muted group-hover:text-q-text transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  )
}

function NoWalletState() {
  const wallets = [
    { name: 'Rabby',           url: 'https://rabby.io' },
    { name: 'MetaMask',        url: 'https://metamask.io' },
    { name: 'Coinbase Wallet', url: 'https://www.coinbase.com/wallet' },
    { name: 'Rainbow',         url: 'https://rainbow.me' },
  ]
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-quest-surface border border-quest-border flex items-center justify-center mx-auto text-2xl">🦺</div>
      <div>
        <p className="text-q-text font-semibold mb-1">No wallet detected</p>
        <p className="text-quest-muted text-sm">Install an EVM wallet to continue</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {wallets.map(w => (
          <a key={w.name} href={w.url} target="_blank" rel="noopener noreferrer"
            className="border border-quest-border rounded-xl px-3 py-2.5 text-sm text-quest-subtle hover:text-q-text hover:border-quest-purple/40 transition-all text-center font-medium">
            {w.name}
          </a>
        ))}
      </div>
    </div>
  )
}
