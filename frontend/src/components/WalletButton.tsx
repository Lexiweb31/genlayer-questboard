import { shortAddr, formatGEN } from '../hooks/useTx'
import { useClaimable } from '../hooks/useQuests'

interface Props {
  address: string | null
  connecting: boolean
  onConnect: () => void
  onDisconnect: () => void
  onWithdraw: () => Promise<void>
  withdrawing: boolean
}

export function WalletButton({ address, connecting, onConnect, onDisconnect, onWithdraw, withdrawing }: Props) {
  const { amount, refresh } = useClaimable(address)

  const handleWithdraw = async () => {
    await onWithdraw()
    refresh()
  }

  if (!address) {
    return (
      <button className="btn-primary text-sm" onClick={onConnect} disabled={connecting}>
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {amount > BigInt(0) && (
        <button
          className="btn-gold text-sm"
          onClick={handleWithdraw}
          disabled={withdrawing}
        >
          {withdrawing ? 'Claiming…' : `Claim ${formatGEN(amount)} GEN`}
        </button>
      )}
      <div className="flex items-center gap-2 border border-quest-border rounded-lg px-3 py-2">
        <span className="w-2 h-2 rounded-full bg-quest-green inline-block" />
        <span className="text-sm text-white font-mono">{shortAddr(address)}</span>
        <button
          className="text-quest-muted hover:text-quest-red text-xs ml-1 transition-colors"
          onClick={onDisconnect}
          title="Disconnect"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
