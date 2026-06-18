import { useState, useMemo, type FormEvent } from 'react'
import { useQuest, useSubmissions } from '../hooks/useQuests'
import { useTx, formatGEN, displayName } from '../hooks/useTx'
import { ConsensusTracker } from './ConsensusTracker'
import { CategoryBadge } from './CategoryBadge'
import { AppealModal } from './AppealModal'
import type { Submission, Quest, ProofPlatform } from '../types'
import { PLATFORM_META, RANK_LABELS, RANK_COLORS } from '../types'
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
  if (!quest)   return <div className="text-q-muted text-center py-24 text-sm">Quest not found.</div>

  const isCreator = address?.toLowerCase() === quest.creator.toLowerCase()
  const canSubmit = !!address && !isCreator && quest.active && !quest.completed
  const canCancel = isCreator && quest.active && !quest.completed
  const isBugBounty = quest.quest_type === 'bug_bounty'

  return (
    <div className="max-w-5xl mx-auto pb-16">

      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-q-muted hover:text-q-text text-sm mb-10 transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Back to Board
      </button>

      {/* ── Two-column layout ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10">

        {/* ── Left: main content ─────────────────────────────────── */}
        <div className="min-w-0">

          {/* Meta chips */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <StatusPill active={quest.active} completed={quest.completed} />
            <CategoryBadge category={quest.category ?? 'other'} />
            {isBugBounty && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-orange-400/10 text-orange-400 border border-orange-400/20">
                🐛 Bug Bounty
              </span>
            )}
            <span className="text-xs text-q-muted/40 font-mono">#{quest.id}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-[2.6rem] font-black text-q-text leading-[1.15] tracking-tight mb-6">
            {quest.title}
          </h1>

          {/* Description */}
          {quest.description && (
            <p className="text-base text-q-subtle leading-relaxed mb-8 max-w-xl">
              {quest.description}
            </p>
          )}

          {/* Requirements */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-q-border/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-q-muted px-2">
                {isBugBounty ? 'Valid Bug Criteria' : 'Completion Requirements'}
              </span>
              <div className="h-px flex-1 bg-q-border/50" />
            </div>
            <div className="rounded-2xl bg-q-surface border border-q-border/50 px-6 py-5 space-y-3">
              {quest.requirements.split('\n').filter(Boolean).map((line, i) => (
                <div key={i} className="flex items-start gap-4">
                  <span className="w-6 h-6 rounded-full bg-q-purple/10 text-q-purple text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-sm text-q-text leading-relaxed">
                    {line.replace(/^[•\-*\d+\.]\s*/, '')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Connect nudge */}
          {!address && quest.active && (
            <div className="rounded-2xl border border-dashed border-q-border bg-q-surface/40 px-6 py-6 mb-8 text-center">
              <p className="text-q-muted text-sm">Connect your wallet to submit and compete for the reward.</p>
            </div>
          )}

          {/* Submit panel */}
          {canSubmit && (
            <SubmitProofPanel
              questId={questId}
              quest={quest}
              writeClient={writeClient}
              txHistory={txHistory}
              onSubmitted={refresh}
            />
          )}

          {/* Submissions */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-q-border/50" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-q-muted px-2">
                Submissions
              </span>
              <span className="text-xs font-bold text-q-purple bg-q-purple/10 border border-q-purple/20 px-2 py-0.5 rounded-full">
                {sLoading ? '…' : submissions.length}
              </span>
              <div className="h-px flex-1 bg-q-border/50" />
            </div>

            {submissions.length === 0 && !sLoading && (
              <div className="rounded-2xl border border-dashed border-q-border bg-q-surface/40 px-6 py-12 text-center">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-q-muted text-sm">No submissions yet.</p>
                <p className="text-q-muted/60 text-xs mt-1">Be the first to attempt this quest!</p>
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

        {/* ── Right: sticky sidebar ──────────────────────────────── */}
        <div className="lg:sticky lg:top-6 h-fit space-y-4">

          {/* Reward card */}
          <div className="rounded-2xl border border-q-border/60 bg-q-surface overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-q-muted mb-3">Prize Pool</p>
              <div className="text-5xl font-black text-q-gold tabular-nums leading-none mb-1">
                {formatGEN(quest.reward)}
              </div>
              <div className="text-sm text-q-muted font-medium">GEN total</div>
            </div>

            {/* Prize split */}
            {quest.max_winners > 1 && quest.reward_per_rank?.length > 0 && (
              <div className="border-t border-q-border/50 px-6 py-4 space-y-3">
                {quest.reward_per_rank.map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{['🥇','🥈','🥉'][i]}</span>
                      <span className="text-sm text-q-muted font-medium">
                        {i === 0 ? '1st' : i === 1 ? '2nd' : '3rd'} Place
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-q-text">{formatGEN(r)}</span>
                      <span className="text-xs text-q-muted ml-1">GEN</span>
                      {i < quest.winner_count && (
                        <div className="text-[10px] text-q-green">awarded</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Winners progress */}
            <div className="border-t border-q-border/50 px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-q-muted">Winners</span>
                <span className="text-xs font-bold text-q-text">
                  {quest.winner_count ?? 0} / {quest.max_winners ?? 1}
                </span>
              </div>
              <div className="h-1.5 bg-q-border/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-q-purple rounded-full transition-all"
                  style={{ width: `${((quest.winner_count ?? 0) / (quest.max_winners ?? 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Meta card */}
          <div className="rounded-2xl border border-q-border/60 bg-q-surface px-6 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-q-muted mb-1.5">Posted by</p>
              <span className="font-mono text-sm text-q-text bg-q-border/30 px-2.5 py-1 rounded-lg inline-block">
                {displayName(quest.creator)}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-q-muted mb-1.5">Type</p>
              <span className="text-sm text-q-text font-medium capitalize">
                {isBugBounty ? 'Bug Bounty' : 'Task'}
              </span>
            </div>
          </div>

          {/* Cancel action */}
          {canCancel && (
            <CancelButton
              questId={questId} writeClient={writeClient} txHistory={txHistory} onDone={refresh}
              refundAmount={BigInt(quest.reward) - (quest.paid_out != null ? BigInt(quest.paid_out) : 0n)}
              onBack={onBack}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Submit proof ──────────────────────────────────────────────────────────────

const PLATFORMS: ProofPlatform[] = ['x', 'medium', 'github', 'other']

function SubmitProofPanel({ questId, quest, writeClient, txHistory, onSubmitted }: {
  questId: number
  quest: Quest
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
  onSubmitted: () => void
}) {
  const [platform, setPlatform] = useState<ProofPlatform>('other')
  const [proofUrl, setProofUrl] = useState('')
  const [proof, setProof]       = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error, txHash } = useTx(writeClient as any)
  const busy = status === 'pending'
  const isBugBounty = quest.quest_type === 'bug_bounty'
  const meta = PLATFORM_META[platform]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const hash = await sendAsync('submit_proof', [questId, proof, proofUrl, platform])
    txHistory.add({ hash, fn: 'submit_proof', label: `Submit to Quest #${questId}`, timestamp: Date.now() })
    setProof(''); setProofUrl('')
    onSubmitted()
  }

  return (
    <div className="rounded-2xl border border-q-border/60 bg-q-surface mb-10 overflow-hidden">
      <div className="px-6 py-5 border-b border-q-border/50">
        <h2 className="font-bold text-q-text text-base">
          {isBugBounty ? '🐛 Report a Bug' : '⚡ Submit Your Work'}
        </h2>
        <p className="text-xs text-q-muted mt-1">
          {isBugBounty
            ? 'Describe the bug clearly. First valid report wins.'
            : 'AI validators will judge your submission against the requirements.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
        {/* Platform */}
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-q-muted mb-3 block">
            Where did you post?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PLATFORMS.map(p => {
              const m = PLATFORM_META[p]
              const active = platform === p
              return (
                <button key={p} type="button" onClick={() => setPlatform(p)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    active
                      ? 'border-q-purple/50 bg-q-purple/8 text-q-text'
                      : 'border-q-border/60 text-q-muted hover:border-q-border hover:text-q-text'
                  }`}
                >
                  <span className="text-base w-5 text-center">{m.icon}</span>
                  <span className="truncate">{m.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {platform !== 'other' && (
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-q-muted mb-2 block">
              {meta.label} Link
            </label>
            <input className="input text-sm" type="url" placeholder={meta.placeholder}
              value={proofUrl} onChange={e => setProofUrl(e.target.value)} />
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-q-muted mb-2 block">
            {isBugBounty ? 'Bug Description & Reproduction Steps' : 'Description'}
            {platform !== 'other' && (
              <span className="text-q-muted/40 ml-2 normal-case font-normal">optional if link provided</span>
            )}
          </label>
          <textarea
            className="input resize-none h-28 text-sm"
            placeholder={
              isBugBounty
                ? 'Steps to reproduce:\n1. ...\nExpected: ...\nActual: ...'
                : 'Describe what you did. Be specific about how it meets each requirement.'
            }
            value={proof} onChange={e => setProof(e.target.value)}
          />
        </div>

        {error && <div className="bg-q-red/8 border border-q-red/25 rounded-xl px-4 py-3 text-q-red text-sm">{error}</div>}
        {txHash && <div className="bg-q-green/8 border border-q-green/25 rounded-xl px-4 py-3 text-q-green text-sm">Submitted! AI validators are evaluating your proof.</div>}

        <button type="submit" className="btn-primary w-full" disabled={busy || !(proof.trim() || proofUrl.trim())}>
          {busy ? <span className="flex items-center justify-center gap-2"><Spinner /> Submitting…</span>
               : isBugBounty ? 'Submit Bug Report' : 'Submit Proof'}
        </button>
      </form>
    </div>
  )
}

// ── Submission card ───────────────────────────────────────────────────────────

function SubmissionCard({ quest, sub, address, writeClient, txHistory, questActive, questCompleted, onEvaluated }: {
  quest: Quest; sub: Submission; address: string | null; writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>; questActive: boolean; questCompleted: boolean; onEvaluated: () => void
}) {
  const [showAppeal, setAppeal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error } = useTx(writeClient as any)
  const busy = status === 'pending'
  const isCreator   = !!address && address.toLowerCase() === quest.creator.toLowerCase()
  const canEvaluate = isCreator && !sub.evaluated && questActive && !questCompleted
  const canAppeal   = !!address && sub.evaluated && !sub.appealed && !!writeClient
  const approved    = sub.approved && sub.rank > 0
  const rejected    = sub.evaluated && !sub.approved

  // Derive evalHash from txHistory so it survives page navigation
  const evalHash = useMemo(() => {
    const record = txHistory.records.find(
      r => r.fn === 'evaluate_submission' &&
      r.label === `Evaluate #${sub.id} on Quest #${quest.id}` &&
      !r.finalPhase
    )
    return record?.hash ?? null
  }, [txHistory.records, sub.id, quest.id])

  // Derive creatorEvalHash for manual approve/reject transactions
  const creatorEvalHash = useMemo(() => {
    const record = txHistory.records.find(
      r => r.fn === 'creator_evaluate' &&
      (r.label === `Approve #${sub.id} on Quest #${quest.id}` || r.label === `Reject #${sub.id} on Quest #${quest.id}`) &&
      !r.finalPhase
    )
    return record?.hash ?? null
  }, [txHistory.records, sub.id, quest.id])

  const handleApprove = async () => {
    try {
      const hash = await sendAsync('creator_evaluate', [quest.id, sub.id, true, 'Approved by quest creator'])
      txHistory.add({ hash, fn: 'creator_evaluate', label: `Approve #${sub.id} on Quest #${quest.id}`, timestamp: Date.now() })
    } catch { /* error shown via useTx error state */ }
  }
  const handleReject = async () => {
    try {
      const hash = await sendAsync('creator_evaluate', [quest.id, sub.id, false, 'Rejected by quest creator'])
      txHistory.add({ hash, fn: 'creator_evaluate', label: `Reject #${sub.id} on Quest #${quest.id}`, timestamp: Date.now() })
    } catch { /* error shown via useTx error state */ }
  }
  const handleEvaluate = async () => {
    try {
      const hash = await sendAsync('evaluate_submission', [quest.id, sub.id])
      txHistory.add({ hash, fn: 'evaluate_submission', label: `Evaluate #${sub.id} on Quest #${quest.id}`, timestamp: Date.now() })
    } catch { /* error shown via useTx error state */ }
  }
  const handleConsensusFinished = (success: boolean) => {
    if (success && evalHash) txHistory.update(evalHash, { finalPhase: 'FINALIZED', finalResult: 'SUCCESS' })
    onEvaluated()
  }
  const handleCreatorEvalFinished = (success: boolean) => {
    if (success && creatorEvalHash) txHistory.update(creatorEvalHash, { finalPhase: 'FINALIZED', finalResult: 'SUCCESS' })
    onEvaluated()
  }

  return (
    <div className={`rounded-2xl border bg-q-surface overflow-hidden ${
      approved ? 'border-q-green/30' : rejected ? 'border-q-red/25' : 'border-q-border/60'
    }`}>
      {/* Header strip */}
      <div className={`px-5 py-3 flex items-center justify-between gap-3 border-b ${
        approved ? 'border-q-green/20 bg-q-green/5' : rejected ? 'border-q-red/15 bg-q-red/5' : 'border-q-border/40 bg-q-bg/20'
      }`}>
        <span className="text-xs text-q-muted">
          <span className="font-mono text-q-subtle">{displayName(sub.submitter)}</span>
          <span className="mx-2 opacity-30">·</span>
          Submission #{sub.id}
        </span>
        <div className="flex items-center gap-2">
          {approved && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${RANK_COLORS[sub.rank - 1]}`}>
              {RANK_LABELS[sub.rank - 1]}
            </span>
          )}
          <SubBadge sub={sub} />
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        {sub.proof_url && (
          <a href={sub.proof_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-q-purple hover:text-q-text transition-colors group w-fit">
            <span>{PLATFORM_META[sub.proof_platform]?.icon ?? '🔗'}</span>
            <span className="underline underline-offset-2 group-hover:no-underline truncate max-w-sm">
              {PLATFORM_META[sub.proof_platform]?.label ?? 'Link'}: {sub.proof_url}
            </span>
            <svg className="w-3 h-3 opacity-40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </a>
        )}

        {sub.proof && <p className="text-sm text-q-text leading-relaxed whitespace-pre-wrap">{sub.proof}</p>}

        {/* Prominent verdict banner shown to the submitter */}
        {sub.evaluated && address?.toLowerCase() === sub.submitter.toLowerCase() && (
          rejected ? (
            <div className="rounded-xl border border-q-red/40 bg-q-red/8 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">❌</span>
                <span className="font-bold text-q-red text-sm">Your submission was not approved</span>
              </div>
              <p className="text-xs text-q-red/80 leading-relaxed">
                Unfortunately your submission did not meet the requirements for this quest.
                {sub.reason && <span> The AI judge noted: <em>{sub.reason}</em></span>}
              </p>
              {!sub.appealed && (
                <p className="text-xs text-q-muted mt-2">You may file an appeal below if you believe this decision was incorrect.</p>
              )}
            </div>
          ) : approved ? (
            <div className="rounded-xl border border-q-green/40 bg-q-green/8 px-4 py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🎉</span>
                <span className="font-bold text-q-green text-sm">Your submission was approved!</span>
              </div>
              <p className="text-xs text-q-green/80 leading-relaxed">
                Congratulations — the AI judge approved your submission.
                {sub.reason && <span> Feedback: <em>{sub.reason}</em></span>}
              </p>
            </div>
          ) : null
        )}

        {/* AI reason shown to everyone (creator view / full detail) */}
        {sub.evaluated && sub.reason && address?.toLowerCase() !== sub.submitter.toLowerCase() && (
          <div className={`rounded-xl px-4 py-3 text-sm flex gap-2 ${
            sub.approved ? 'bg-q-green/8 border border-q-green/25 text-q-green'
                        : 'bg-q-red/8 border border-q-red/25 text-q-red'
          }`}>
            <span className="font-bold flex-shrink-0">AI:</span>
            <span>{sub.reason}</span>
          </div>
        )}

        {sub.appealed && sub.appeal_resolved && (
          <div className={`rounded-xl px-4 py-3 text-sm ${
            sub.appeal_overturned ? 'bg-q-gold/8 border border-q-gold/25 text-q-gold'
                                  : 'bg-q-border/30 border border-q-border text-q-muted'
          }`}>
            <span className="font-bold">{sub.appeal_overturned ? '⚖️ Overturned: ' : '⚖️ Upheld: '}</span>
            {sub.appeal_result_reason}
          </div>
        )}

        {evalHash !== null && !sub.evaluated && <ConsensusTracker hash={evalHash} onDone={handleConsensusFinished} />}
        {creatorEvalHash !== null && !sub.evaluated && <ConsensusTracker hash={creatorEvalHash} onDone={handleCreatorEvalFinished} />}

        {canEvaluate && !evalHash && !creatorEvalHash && (
          <div className="space-y-2 pt-1">
            {error && <div className="bg-q-red/8 border border-q-red/25 rounded-xl px-4 py-3 text-q-red text-sm">{error}</div>}
            {/* Primary: manual approve / reject */}
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-q-green/15 border border-q-green/40 text-q-green hover:bg-q-green/25 transition-all disabled:opacity-50"
                onClick={handleApprove} disabled={busy}
              >
                {busy ? <Spinner /> : '✓'} Approve
              </button>
              <button
                className="flex items-center justify-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl bg-q-red/10 border border-q-red/35 text-q-red hover:bg-q-red/20 transition-all disabled:opacity-50"
                onClick={handleReject} disabled={busy}
              >
                {busy ? <Spinner /> : '✕'} Reject
              </button>
            </div>
            {/* Secondary: AI evaluation */}
            <button className="btn-ghost text-xs w-full text-q-muted hover:text-q-text" onClick={handleEvaluate} disabled={busy}>
              🤖 Request AI Evaluation instead
            </button>
          </div>
        )}

        {/* Submitter view: show waiting state when not yet evaluated and no active tracker */}
        {!sub.evaluated && !canEvaluate && !evalHash && (
          <div className="flex items-center gap-2.5 rounded-xl border border-q-border/50 bg-q-bg/40 px-4 py-3 text-xs text-q-muted">
            <Spinner />
            <span>Waiting for the quest creator to evaluate…</span>
          </div>
        )}

        {canAppeal && !sub.appealed && (
          <div className="border-t border-q-border/40 pt-4">
            <button className="btn-ghost text-xs w-full text-q-muted hover:text-q-text" onClick={() => setAppeal(true)}>
              ⚖️ Dispute this decision — File an Appeal
            </button>
          </div>
        )}

        {sub.appealed && !sub.appeal_resolved && (
          <div className="flex items-center gap-2 text-xs text-q-gold border-t border-q-border/40 pt-4">
            <Spinner /> Appeal in progress…
          </div>
        )}
      </div>

      {showAppeal && (
        <AppealModal quest={quest} submission={sub} submissionId={sub.id}
          writeClient={writeClient} txHistory={txHistory}
          onClose={() => setAppeal(false)} onDone={onEvaluated} />
      )}
    </div>
  )
}

// ── Cancel ────────────────────────────────────────────────────────────────────

function CancelButton({ questId, writeClient, txHistory, onDone, refundAmount, onBack }: {
  questId: number; writeClient: unknown; txHistory: ReturnType<typeof useTxHistory>; onDone: () => void; refundAmount: bigint; onBack: () => void
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error } = useTx(writeClient as any)
  const busy = status === 'pending'
  const [submitted, setSubmitted] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancel this quest and reclaim your reward? This cannot be undone.')) return
    const hash = await sendAsync('cancel_quest', [questId])
    txHistory.add({ hash, fn: 'cancel_quest', label: `Cancel Quest #${questId}`, timestamp: Date.now() })
    setSubmitted(true)
    onDone()
    setTimeout(onBack, 1500)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-q-gold/20 bg-q-gold/5 px-5 py-4 space-y-1.5">
        <p className="text-sm font-semibold text-q-gold">Cancellation submitted</p>
        <p className="text-xs text-q-muted leading-relaxed">
          Your <span className="text-q-gold font-semibold">{formatGEN(refundAmount)} GEN</span> will be returned directly to your wallet once the transaction is confirmed (~30s).
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-q-red/20 bg-q-surface px-5 py-4">
      {error && <div className="text-q-red text-sm mb-3">{error}</div>}
      <button
        className="w-full text-sm font-medium text-q-red hover:text-q-red/80 transition-colors"
        onClick={handleCancel} disabled={busy}
      >
        {busy ? 'Cancelling…' : 'Cancel Quest & Reclaim Reward'}
      </button>
      <p className="text-xs text-q-muted/50 text-center mt-1.5">GEN is returned directly to your wallet.</p>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function StatusPill({ active, completed }: { active: boolean; completed: boolean }) {
  if (completed) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-q-green/10 text-q-green border border-q-green/20">
      <span className="w-1.5 h-1.5 rounded-full bg-q-green" />Completed
    </span>
  )
  if (!active) return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-q-muted/10 text-q-muted border border-q-muted/20">
      <span className="w-1.5 h-1.5 rounded-full bg-q-muted" />Cancelled
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-q-purple/10 text-q-purple border border-q-purple/20">
      <span className="w-1.5 h-1.5 rounded-full bg-q-purple animate-pulse" />Active
    </span>
  )
}

function SubBadge({ sub }: { sub: Submission }) {
  if (!sub.evaluated)               return <span className="text-xs text-q-muted px-2.5 py-0.5 rounded-full border border-q-border">Pending</span>
  if (sub.approved && sub.rank > 0) return <span className="text-xs text-q-green px-2.5 py-0.5 rounded-full border border-q-green/30 bg-q-green/8 font-semibold">Won</span>
  if (sub.approved)                 return <span className="text-xs text-q-green px-2.5 py-0.5 rounded-full border border-q-green/30 bg-q-green/8 font-semibold">Approved</span>
  return                                   <span className="text-xs text-q-red   px-2.5 py-0.5 rounded-full border border-q-red/30   bg-q-red/8   font-semibold">Rejected</span>
}

function LoadingPanel() {
  return (
    <div className="flex items-center justify-center py-32 text-q-muted gap-3 text-sm">
      <Spinner /> Loading quest…
    </div>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 text-q-purple" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  )
}
