import { useState, type FormEvent } from 'react'
import { useQuest, useSubmissions } from '../hooks/useQuests'
import { useTx, formatGEN, shortAddr } from '../hooks/useTx'
import { ConsensusTracker } from './ConsensusTracker'
import { CategoryBadge } from './CategoryBadge'
import { AppealModal } from './AppealModal'
import type { Submission, Quest } from '../types'
import type { useTxHistory } from '../hooks/useTxHistory'

interface Props {
  questId: number
  address: string | null
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
  onBack: () => void
}

export function QuestDetail({ questId, address, writeClient, txHistory, onBack }: Props) {
  const { quest, loading: qLoading, refresh: refreshQuest } = useQuest(questId)
  const { submissions, loading: sLoading, refresh: refreshSubs } = useSubmissions(questId)

  const refresh = () => { refreshQuest(); refreshSubs() }

  if (qLoading) return <LoadingPanel />
  if (!quest)   return <div className="text-quest-muted text-center py-20">Quest not found.</div>

  const isCreator = address?.toLowerCase() === quest.creator.toLowerCase()
  const canSubmit = !!address && !isCreator && quest.active && !quest.completed
  const canCancel = isCreator && quest.active && !quest.completed

  return (
    <div className="max-w-2xl mx-auto">
      <button
        className="text-quest-muted hover:text-white text-sm mb-6 flex items-center gap-1 transition-colors"
        onClick={onBack}
      >
        ← Back to Board
      </button>

      {/* Quest header */}
      <div className="card mb-6 border-quest-purple/40">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <QuestStatusBadge active={quest.active} completed={quest.completed} />
              <CategoryBadge category={quest.category ?? 'other'} />
              <span className="text-xs text-quest-muted font-mono">Quest #{quest.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{quest.title}</h1>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-quest-gold font-bold text-2xl">{formatGEN(quest.reward)}</div>
            <div className="text-quest-muted text-sm">GEN Reward</div>
          </div>
        </div>

        {quest.description && (
          <p className="text-quest-muted text-sm mb-4">{quest.description}</p>
        )}

        <div className="bg-quest-surface rounded-lg p-4 border border-quest-border">
          <div className="text-xs text-quest-gold uppercase tracking-wider mb-2 font-semibold">
            Completion Requirements
          </div>
          <p className="text-sm text-white leading-relaxed whitespace-pre-wrap">{quest.requirements}</p>
        </div>

        <div className="flex items-center justify-between mt-4 text-xs text-quest-muted">
          <span>Posted by <span className="text-white font-mono">{shortAddr(quest.creator)}</span></span>
          {quest.winner && (
            <span className="text-quest-green">
              Winner: <span className="font-mono">{shortAddr(quest.winner)}</span>
            </span>
          )}
        </div>

        {canCancel && (
          <CancelButton questId={questId} writeClient={writeClient} txHistory={txHistory} onDone={refresh} />
        )}
      </div>

      {/* Submit proof */}
      {canSubmit && (
        <SubmitProofPanel
          questId={questId}
          writeClient={writeClient}
          txHistory={txHistory}
          onSubmitted={refresh}
        />
      )}

      {!address && quest.active && (
        <div className="card mb-6 text-center text-quest-muted text-sm border-dashed">
          Connect your wallet to submit proof and win the reward.
        </div>
      )}

      {/* Submissions */}
      <div>
        <h2 className="text-sm font-semibold text-quest-muted uppercase tracking-wider mb-3">
          Submissions ({sLoading ? '…' : submissions.length})
        </h2>
        {submissions.length === 0 && !sLoading && (
          <div className="card text-center text-quest-muted text-sm border-dashed">
            No submissions yet. Be the first to attempt this quest!
          </div>
        )}
        <div className="space-y-4">
          {submissions.map(sub => (
            <SubmissionCard
              key={sub.id}
              quest={quest}
              sub={sub}
              address={address}
              writeClient={writeClient}
              txHistory={txHistory}
              questActive={quest.active}
              questCompleted={quest.completed}
              onEvaluated={refresh}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Submit proof ──────────────────────────────────────────────────────────────

function SubmitProofPanel({
  questId, writeClient, txHistory, onSubmitted,
}: {
  questId: number
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
  onSubmitted: () => void
}) {
  const [proof, setProof] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error, txHash } = useTx(writeClient as any)
  const busy = status === 'pending'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const hash = await sendAsync('submit_proof', [questId, proof])
    txHistory.add({ hash, fn: 'submit_proof', label: `Submit proof to Quest #${questId}`, timestamp: Date.now() })
    setProof('')
    onSubmitted()
  }

  return (
    <div className="card mb-6 border-quest-gold/20">
      <h2 className="text-sm font-semibold text-quest-gold uppercase tracking-wider mb-3">
        Submit Your Proof
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="input resize-none h-36"
          placeholder={
            "Describe exactly what you did.\n" +
            "Include links, code, evidence, screenshots URLs.\n\n" +
            "The AI judge reads this against the requirements — be specific."
          }
          value={proof}
          onChange={e => setProof(e.target.value)}
          required
        />
        {error && (
          <div className="bg-quest-red/10 border border-quest-red/30 rounded-lg px-3 py-2 text-quest-red text-sm">
            {error}
          </div>
        )}
        {txHash && (
          <div className="bg-quest-green/10 border border-quest-green/30 rounded-lg px-3 py-2 text-quest-green text-sm">
            Submitted! Now click "Request AI Evaluation" on your submission below.
          </div>
        )}
        <button type="submit" className="btn-primary w-full" disabled={busy || !proof.trim()}>
          {busy ? 'Submitting…' : 'Submit Proof'}
        </button>
      </form>
    </div>
  )
}

// ── Submission card ───────────────────────────────────────────────────────────

function SubmissionCard({
  quest, sub, address, writeClient, txHistory, questActive, questCompleted, onEvaluated,
}: {
  quest: Quest
  sub: Submission
  address: string | null
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
  questActive: boolean
  questCompleted: boolean
  onEvaluated: () => void
}) {
  const [evalHash, setEvalHash]   = useState<string | null>(null)
  const [showAppeal, setAppeal]   = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error } = useTx(writeClient as any)
  const busy = status === 'pending'

  const canEvaluate = !!address && !sub.evaluated && questActive && !questCompleted
  const canAppeal   = !!address && sub.evaluated && !sub.appealed && !!writeClient
  const showTracker: boolean = evalHash !== null && !sub.evaluated

  const handleEvaluate = async () => {
    const hash = await sendAsync('evaluate_submission', [quest.id, sub.id])
    setEvalHash(hash)
    txHistory.add({
      hash,
      fn: 'evaluate_submission',
      label: `Evaluate submission #${sub.id} on Quest #${quest.id}`,
      timestamp: Date.now(),
    })
  }

  const handleConsensusFinished = (success: boolean) => {
    if (success && evalHash) txHistory.update(evalHash, { finalPhase: 'FINALIZED', finalResult: 'SUCCESS' })
    onEvaluated()
  }

  return (
    <div className={`card ${sub.approved ? 'border-quest-green/40' : sub.evaluated ? 'border-quest-red/30' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="text-xs text-quest-muted font-mono">
          Submission #{sub.id} · by <span className="text-white">{shortAddr(sub.submitter)}</span>
        </div>
        <SubBadge sub={sub} />
      </div>

      <p className="text-sm text-white whitespace-pre-wrap leading-relaxed mb-3">{sub.proof}</p>

      {sub.evaluated && sub.reason && (
        <div className={`rounded-lg px-3 py-2 text-sm mb-3 ${
          sub.approved
            ? 'bg-quest-green/10 border border-quest-green/30 text-quest-green'
            : 'bg-quest-red/10 border border-quest-red/30 text-quest-red'
        }`}>
          <span className="font-semibold">AI Judge: </span>{sub.reason}
        </div>
      )}

      {/* Appeal result */}
      {sub.appealed && sub.appeal_resolved && (
        <div className={`rounded-lg px-3 py-2 text-sm mb-3 ${
          sub.appeal_overturned
            ? 'bg-quest-gold/10 border border-quest-gold/30 text-quest-gold'
            : 'bg-quest-muted/10 border border-quest-border text-quest-muted'
        }`}>
          <span className="font-semibold">
            {sub.appeal_overturned ? '⚖️ Appeal Overturned: ' : '⚖️ Appeal Upheld: '}
          </span>
          {sub.appeal_result_reason}
        </div>
      )}

      {/* Live consensus tracker */}
      {evalHash !== null && !sub.evaluated
        ? <ConsensusTracker hash={evalHash} onDone={handleConsensusFinished} />
        : null}

      {canEvaluate && !evalHash && (
        <>
          {error && (
            <div className="bg-quest-red/10 border border-quest-red/30 rounded-lg px-3 py-2 text-quest-red text-sm mb-2">
              {error}
            </div>
          )}
          <button
            className="btn-primary text-sm w-full"
            onClick={handleEvaluate}
            disabled={busy}
          >
            {busy
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Submitting…</span>
              : 'Request AI Evaluation'}
          </button>
          <p className="text-xs text-quest-muted text-center mt-1">
            Validators will independently run the AI judge and vote on consensus.
          </p>
        </>
      )}

      {/* Appeal button */}
      {canAppeal && !sub.appealed && (
        <div className="border-t border-quest-border mt-3 pt-3">
          <button
            className="btn-ghost text-xs text-quest-gold border-quest-gold/30 hover:border-quest-gold w-full"
            onClick={() => setAppeal(true)}
          >
            ⚖️ Dispute this decision — File an Appeal
          </button>
        </div>
      )}

      {sub.appealed && !sub.appeal_resolved && (
        <div className="border-t border-quest-border mt-3 pt-3">
          <span className="text-xs text-quest-gold flex items-center gap-1.5">
            <Spinner /> Appeal in progress…
          </span>
        </div>
      )}

      {showAppeal && (
        <AppealModal
          quest={quest}
          submission={sub}
          submissionId={sub.id}
          writeClient={writeClient}
          txHistory={txHistory}
          onClose={() => setAppeal(false)}
          onDone={onEvaluated}
        />
      )}
    </div>
  )
}

// ── Cancel ────────────────────────────────────────────────────────────────────

function CancelButton({
  questId, writeClient, txHistory, onDone,
}: {
  questId: number
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
  onDone: () => void
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error } = useTx(writeClient as any)
  const busy = status === 'pending'

  const handleCancel = async () => {
    if (!confirm('Cancel this quest and reclaim your reward? This cannot be undone.')) return
    const hash = await sendAsync('cancel_quest', [questId])
    txHistory.add({ hash, fn: 'cancel_quest', label: `Cancel Quest #${questId}`, timestamp: Date.now() })
    onDone()
  }

  return (
    <div className="mt-4 border-t border-quest-border pt-4">
      {error && <div className="text-quest-red text-sm mb-2">{error}</div>}
      <button
        className="btn-ghost text-sm text-quest-red border-quest-red/30 hover:border-quest-red"
        onClick={handleCancel}
        disabled={busy}
      >
        {busy ? 'Cancelling…' : 'Cancel Quest & Reclaim Reward'}
      </button>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SubBadge({ sub }: { sub: Submission }) {
  if (!sub.evaluated) return <span className="text-xs text-quest-muted px-2 py-0.5 rounded-full border border-quest-border">Pending</span>
  if (sub.approved)   return <span className="text-xs text-quest-green px-2 py-0.5 rounded-full border border-quest-green/30 bg-quest-green/10">Approved</span>
  return <span className="text-xs text-quest-red px-2 py-0.5 rounded-full border border-quest-red/30 bg-quest-red/10">Rejected</span>
}

function QuestStatusBadge({ active, completed }: { active: boolean; completed: boolean }) {
  if (completed) return <span className="px-2 py-0.5 rounded-full bg-quest-green/10 text-quest-green text-xs border border-quest-green/30">Completed</span>
  if (!active)   return <span className="px-2 py-0.5 rounded-full bg-quest-muted/10 text-quest-muted text-xs border border-quest-muted/30">Cancelled</span>
  return <span className="px-2 py-0.5 rounded-full bg-quest-purple/10 text-quest-purple text-xs border border-quest-purple/30">Active</span>
}

function LoadingPanel() {
  return (
    <div className="flex items-center justify-center py-24 text-quest-muted">
      <Spinner /> <span className="ml-2">Loading quest…</span>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-quest-purple" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
