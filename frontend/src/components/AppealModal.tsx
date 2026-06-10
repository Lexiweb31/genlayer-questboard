import { useState, type FormEvent } from 'react'
import { useTx, parseGEN, formatGEN } from '../hooks/useTx'
import { ConsensusTracker } from './ConsensusTracker'
import type { Submission, Quest } from '../types'
import type { useTxHistory } from '../hooks/useTxHistory'

interface Props {
  quest: Quest
  submission: Submission
  submissionId: number
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
  onClose: () => void
  onDone: () => void
}

export function AppealModal({ quest, submission, submissionId, writeClient, txHistory, onClose, onDone }: Props) {
  const [reason, setReason]   = useState('')
  const [bondGEN, setBond]    = useState('0.1')
  const [appealHash, setHash] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error } = useTx(writeClient as any)
  const busy = status === 'pending'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const bond = parseGEN(bondGEN)
    const hash = await sendAsync('appeal_evaluation', [quest.id, submissionId, reason], bond)
    setHash(hash)
    txHistory.add({
      hash,
      fn: 'appeal_evaluation',
      label: `Appeal submission #${submissionId} on Quest #${quest.id}`,
      timestamp: Date.now(),
    })
  }

  const handleDone = (success: boolean) => {
    if (success && appealHash) {
      txHistory.update(appealHash, { finalPhase: 'FINALIZED', finalResult: 'SUCCESS' })
    }
    onDone()
    onClose()
  }

  const originalDecision = submission.approved ? 'APPROVED' : 'REJECTED'
  const originalColor    = submission.approved ? 'text-quest-green' : 'text-quest-red'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!busy && !appealHash ? onClose : undefined} />

      <div className="relative card w-full max-w-lg z-10 shadow-2xl border-quest-gold/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Appeal Evaluation</h2>
          {!busy && !appealHash && (
            <button className="text-quest-muted hover:text-white transition-colors" onClick={onClose}>✕</button>
          )}
        </div>

        {/* Original decision context */}
        <div className="bg-quest-surface rounded-lg p-3 border border-quest-border mb-4 text-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-quest-muted">Quest:</span>
            <span className="text-white font-medium">{quest.title}</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-quest-muted">Original decision:</span>
            <span className={`font-bold ${originalColor}`}>{originalDecision}</span>
          </div>
          <div className="text-quest-muted text-xs">
            AI reason: <span className="text-white italic">{submission.reason}</span>
          </div>
        </div>

        {/* Appeal form */}
        {!appealHash ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Your Argument</label>
              <textarea
                className="input resize-none h-32"
                placeholder={submission.approved
                  ? "Explain why this submission should NOT have been approved. What requirement was not actually met?"
                  : "Explain why this submission SHOULD have been approved. What did the AI judge miss or misinterpret?"}
                value={reason}
                onChange={e => setReason(e.target.value)}
                required
              />
              <p className="text-xs text-quest-muted mt-1">
                Be specific — the appeal AI judge reads both your argument and the original proof.
              </p>
            </div>

            <div>
              <label className="label">Appeal Bond (GEN)</label>
              <div className="flex items-center gap-2">
                <input
                  className="input w-32"
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={bondGEN}
                  onChange={e => setBond(e.target.value)}
                  required
                />
                <span className="text-quest-gold font-bold">GEN</span>
              </div>
              <p className="text-xs text-quest-muted mt-1">
                Bond is refunded if your appeal succeeds. Lost if the appeal fails.
              </p>
            </div>

            <div className="bg-quest-surface/50 rounded-lg p-3 border border-quest-border text-xs text-quest-muted space-y-1">
              <div className="font-semibold text-white mb-1">What happens on success:</div>
              {submission.approved ? (
                <>
                  <div>• The approval is overturned — submission marked rejected</div>
                  <div>• The winner's reward is clawed back from their claimable balance</div>
                  <div>• The quest reopens for new submissions</div>
                  <div>• Your bond is refunded</div>
                </>
              ) : (
                <>
                  <div>• The rejection is overturned — submission marked approved</div>
                  <div>• The {formatGEN(quest.reward)} GEN reward is credited to the submitter</div>
                  <div>• The quest is marked completed</div>
                  <div>• Your bond is refunded</div>
                </>
              )}
            </div>

            {error && (
              <div className="bg-quest-red/10 border border-quest-red/30 rounded-lg px-3 py-2 text-quest-red text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1" disabled={busy || !reason.trim()}>
                {busy ? 'Filing Appeal…' : `File Appeal — Bond ${bondGEN} GEN`}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p className="text-sm text-quest-muted mb-3">
              Appeal filed. Validators are re-evaluating with your argument as additional context.
            </p>
            <ConsensusTracker hash={appealHash} onDone={handleDone} />
            <button className="btn-ghost w-full mt-4 text-sm" onClick={() => { onDone(); onClose() }}>
              Close (appeal continues in background)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
