import { useRef, useEffect } from 'react'
import { usePollTx, type TxPhase } from '../hooks/usePollTx'

interface Props {
  hash: string | null
  onDone?: (success: boolean) => void
}

const STEPS: { phase: TxPhase; label: string; icon: string }[] = [
  { phase: 'PENDING',    label: 'Submitted',              icon: '📤' },
  { phase: 'PROPOSING',  label: 'Leader Proposing',       icon: '👑' },
  { phase: 'COMMITTING', label: 'Validators Committing',  icon: '🔒' },
  { phase: 'REVEALING',  label: 'Validators Revealing',   icon: '🔓' },
  { phase: 'ACCEPTED',   label: 'Consensus Reached',      icon: '✅' },
  { phase: 'FINALIZED',  label: 'Finalized',              icon: '🏆' },
]

const PHASE_INDEX: Partial<Record<TxPhase, number>> = {
  PENDING: 0, PROPOSING: 1, COMMITTING: 2, REVEALING: 3, ACCEPTED: 4, FINALIZED: 5,
}

const ERROR_PHASES: TxPhase[] = ['UNDETERMINED', 'CANCELED', 'VALIDATORS_TIMEOUT', 'LEADER_TIMEOUT']
const SUCCESS_PHASES: TxPhase[] = ['ACCEPTED', 'FINALIZED']

export function ConsensusTracker({ hash, onDone }: Props) {
  const { phase, result, done, error } = usePollTx(hash)
  const prevDone = useRef(false)

  useEffect(() => {
    if (done && !prevDone.current) {
      prevDone.current = true
      const success = phase !== null && (SUCCESS_PHASES.includes(phase) || !ERROR_PHASES.includes(phase))
      onDone?.(success)
    }
  }, [done, phase, result, onDone])

  if (!hash) return null

  const currentIdx = phase ? (PHASE_INDEX[phase] ?? -1) : -1
  const isError = phase !== null && ERROR_PHASES.includes(phase)

  return (
    <div className="bg-quest-surface border border-quest-border rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-quest-muted uppercase tracking-wider">
          GenLayer Consensus
        </span>
        <span className="text-xs text-quest-purple font-mono" title={hash ?? ''}>
          {hash ? `${hash.slice(0, 10)}…` : ''}
        </span>
      </div>

      {/* Step progress bar */}
      <div className="flex items-start gap-0 mb-4">
        {STEPS.map((step, i) => {
          const isActive    = i === currentIdx
          const isCompleted = i < currentIdx
          const isFailed    = isError && i === currentIdx

          return (
            <div key={step.phase} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-300
                  ${isFailed    ? 'bg-quest-red/10 border-quest-red' :
                    isActive    ? 'bg-quest-purple/20 border-quest-purple animate-pulse' :
                    isCompleted ? 'bg-quest-green/10 border-quest-green' :
                                  'bg-quest-surface border-quest-border opacity-30'}
                `}>
                  {step.icon}
                </div>
                <span className={`text-[9px] mt-1 text-center leading-tight w-14 ${
                  isFailed    ? 'text-quest-red' :
                  isActive    ? 'text-quest-purple' :
                  isCompleted ? 'text-quest-green' :
                                'text-quest-muted opacity-30'
                }`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 transition-all duration-500 ${
                  isCompleted ? 'bg-quest-green' : 'bg-quest-border opacity-30'
                }`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Status message */}
      {isError && (
        <div className="bg-quest-red/10 border border-quest-red/30 rounded-lg px-3 py-2 text-quest-red text-xs">
          Transaction failed: {phase}{error ? ` — ${error}` : ''}
        </div>
      )}
      {done && !isError && (
        <div className="bg-quest-green/10 border border-quest-green/30 rounded-lg px-3 py-2 text-quest-green text-xs">
          Finalized — AI evaluation complete.
        </div>
      )}
      {!done && !isError && phase && (
        <div className="flex items-center gap-2 text-xs text-quest-muted">
          <Spinner />
          <span>{PHASE_LABELS[phase] ?? `Status: ${phase}`}</span>
        </div>
      )}
    </div>
  )
}

const PHASE_LABELS: Partial<Record<TxPhase, string>> = {
  PENDING:    'Transaction submitted, waiting for leader selection…',
  PROPOSING:  'Leader validator is running the AI evaluation…',
  COMMITTING: 'Validators are committing their votes…',
  REVEALING:  'Validators are revealing and tallying votes…',
  ACCEPTED:   'Consensus reached, entering finality window…',
}

function Spinner() {
  return (
    <svg className="animate-spin h-3 w-3 text-quest-purple flex-shrink-0" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
