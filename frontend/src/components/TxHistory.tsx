import type { TxRecord } from '../hooks/useTxHistory'
import { usePollTx } from '../hooks/usePollTx'
import { shortAddr } from '../hooks/useTx'

interface Props {
  records: TxRecord[]
  onClear: () => void
  onClose: () => void
}

export function TxHistoryPanel({ records, onClear, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-quest-surface border-l border-quest-border h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-quest-border">
          <div>
            <h2 className="text-white font-semibold">Transaction History</h2>
            <p className="text-xs text-quest-muted mt-0.5">{records.length} transactions</p>
          </div>
          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                className="text-xs text-quest-muted hover:text-quest-red transition-colors"
                onClick={onClear}
              >
                Clear
              </button>
            )}
            <button
              className="text-quest-muted hover:text-white transition-colors text-lg leading-none"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {records.length === 0 && (
            <div className="text-center text-quest-muted text-sm py-16">
              No transactions yet.
            </div>
          )}
          {records.map(r => (
            <TxRow key={r.hash} record={r} />
          ))}
        </div>
      </div>
    </div>
  )
}

function TxRow({ record }: { record: TxRecord }) {
  const { phase, done } = usePollTx(record.finalPhase ? null : record.hash)

  const currentPhase = record.finalPhase ?? phase
  const isError = currentPhase === 'UNDETERMINED' || currentPhase === 'CANCELED' ||
                  currentPhase === 'VALIDATORS_TIMEOUT' || currentPhase === 'LEADER_TIMEOUT'
  const isFinalized = currentPhase === 'FINALIZED' || !!record.finalPhase
  const isPending = !done && !record.finalPhase

  return (
    <div className="card py-3 px-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-white text-sm font-medium truncate flex-1">{record.label}</span>
        <TxBadge phase={currentPhase} isError={isError} isFinalized={isFinalized} isPending={isPending} />
      </div>
      <div className="flex items-center justify-between text-xs text-quest-muted">
        <span className="font-mono">{shortAddr(record.hash)}</span>
        <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
      </div>
      {currentPhase && !isFinalized && !isError && (
        <div className="text-xs text-quest-purple mt-1 flex items-center gap-1">
          <Spinner />
          {currentPhase}
        </div>
      )}
    </div>
  )
}

function TxBadge({
  phase, isError, isFinalized, isPending,
}: { phase: string | null; isError: boolean; isFinalized: boolean; isPending: boolean }) {
  if (isError)    return <span className="text-xs text-quest-red border border-quest-red/30 bg-quest-red/10 px-2 py-0.5 rounded-full flex-shrink-0">Failed</span>
  if (isFinalized) return <span className="text-xs text-quest-green border border-quest-green/30 bg-quest-green/10 px-2 py-0.5 rounded-full flex-shrink-0">Finalized</span>
  if (isPending)  return <span className="text-xs text-quest-purple border border-quest-purple/30 bg-quest-purple/10 px-2 py-0.5 rounded-full flex-shrink-0 animate-pulse">In Progress</span>
  return <span className="text-xs text-quest-muted border border-quest-border px-2 py-0.5 rounded-full flex-shrink-0">{phase ?? 'Unknown'}</span>
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
