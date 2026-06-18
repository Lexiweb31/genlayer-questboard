import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTx, parseGEN, formatGEN } from '../hooks/useTx'
import { CATEGORIES, type Category, type QuestType } from '../types'
import { PageTransition } from '../components/PageTransition'

interface Props {
  writeClient: unknown
  onCreated?: (hash: string) => void
  onOpenPicker?: () => void
}

const CAT_ICONS: Record<Category, React.ReactNode> = {
  creative:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  technical:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline strokeLinecap="round" strokeLinejoin="round" points="16 18 22 12 16 6"/><polyline strokeLinecap="round" strokeLinejoin="round" points="8 6 2 12 8 18"/></svg>,
  research:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="M21 21l-4.35-4.35"/></svg>,
  social:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  gaming:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="2" y="6" width="20" height="12" rx="2"/><path strokeLinecap="round" d="M6 12h4M8 10v4M15 12h2M17 12h2"/></svg>,
  bug_bounty: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 22c4.97 0 9-4.03 9-9H3c0 4.97 4.03 9 9 9z"/><path strokeLinecap="round" d="M12 13V7M9 7h6M6 13H3M21 13h-3M6.3 6.3l-2-2M17.7 6.3l2-2"/></svg>,
  other:      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M5 3l14 9-14 9V3z"/></svg>,
}

const CAT_LABELS: Record<Category, string> = {
  creative: 'Creative', technical: 'Technical', research: 'Research',
  social: 'Social', gaming: 'Gaming', bug_bounty: 'Bug Bounty', other: 'Other',
}

const SPLIT_PREVIEW: Record<number, { label: string; pct: number; color: string }[]> = {
  1: [{ label: '🥇 Winner', pct: 100, color: 'text-q-gold' }],
  2: [
    { label: '🥇 1st', pct: 60, color: 'text-q-gold' },
    { label: '🥈 2nd', pct: 40, color: 'text-slate-300' },
  ],
  3: [
    { label: '🥇 1st', pct: 50, color: 'text-q-gold' },
    { label: '🥈 2nd', pct: 30, color: 'text-slate-300' },
    { label: '🥉 3rd', pct: 20, color: 'text-orange-400' },
  ],
}

export function PostQuestPage({ writeClient, onCreated, onOpenPicker }: Props) {
  const navigate = useNavigate()

  const [questType, setQuestType] = useState<QuestType>('task')
  const [title, setTitle]         = useState('')
  const [description, setDesc]    = useState('')
  const [requirements, setReqs]   = useState('')
  const [rewardGEN, setReward]    = useState('1')
  const [category, setCategory]   = useState<Category>('other')
  const [maxWinners, setMaxWinners] = useState(1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sendAsync, status, error } = useTx(writeClient as any)
  const busy = status === 'pending'

  const effectiveMaxWinners = questType === 'bug_bounty' ? 1 : maxWinners
  const rewardBigint = (() => { try { return parseGEN(rewardGEN) } catch { return BigInt(0) } })()
  const splits = SPLIT_PREVIEW[effectiveMaxWinners] ?? SPLIT_PREVIEW[1]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!writeClient) { onOpenPicker?.(); return }
    try {
      const value = parseGEN(rewardGEN)
      const hash = await sendAsync('create_quest', [title, description, requirements, category, effectiveMaxWinners, questType], value)
      onCreated?.(hash)
      navigate('/active')
    } catch {
      // error shown via useTx
    }
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-q-muted hover:text-q-text text-sm mb-5 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-q-text">Post a Quest</h1>
              <p className="text-sm text-q-muted mt-0.5">Lock a reward. AI validators judge every submission on-chain.</p>
            </div>
          </div>
        </div>

        {!writeClient && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 bg-q-gold/8 border border-q-gold/25 rounded-xl px-4 py-3 text-sm text-q-gold"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Connect your wallet to post a quest.
            <button onClick={onOpenPicker} className="ml-auto underline font-semibold hover:no-underline">Connect →</button>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Section 0: Quest Type */}
          <Section number={0} label="Quest Type">
            <div className="grid grid-cols-2 gap-3">
              <TypeButton
                active={questType === 'task'}
                onClick={() => { setQuestType('task'); if (category === 'bug_bounty') setCategory('other') }}
                icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5h6M9 12l2 2 4-4"/></svg>}
                label="Task / Quest"
                desc="Creative, research, social, technical challenges. Up to 3 winners."
              />
              <TypeButton
                active={questType === 'bug_bounty'}
                onClick={() => { setQuestType('bug_bounty'); setCategory('bug_bounty'); setMaxWinners(1) }}
                icon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 22c4.97 0 9-4.03 9-9H3c0 4.97 4.03 9 9 9z"/><path strokeLinecap="round" d="M12 13V7M9 7h6"/></svg>}
                label="Bug Bounty"
                desc="Report a real bug in your project. First valid report wins."
                accent="orange"
              />
            </div>
          </Section>

          {/* Section 1: Quest Details */}
          <Section number={1} label="Quest Details">
            <div>
              <label className="label">Quest Title</label>
              <input
                className="input"
                placeholder={questType === 'bug_bounty' ? 'e.g. SQL Injection in Login Form' : 'e.g. Write a Haiku about Blockchain'}
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {questType === 'task' && (
              <div>
                <label className="label">Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.filter(c => c !== 'bug_bounty').map(cat => {
                    const active = category === cat
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                          active
                            ? 'border-q-purple/70 text-q-text bg-q-purple/15'
                            : 'border-q-border/60 text-q-muted bg-q-bg hover:border-q-purple/30 hover:text-q-text hover:bg-q-purple/5'
                        }`}
                      >
                        <span className={active ? 'text-q-purple' : 'text-q-muted'}>{CAT_ICONS[cat]}</span>
                        <span>{CAT_LABELS[cat]}</span>
                        {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-q-purple flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="label">
                {questType === 'bug_bounty' ? 'Description / Scope' : 'Description'}
                <span className="normal-case font-normal text-q-muted/50 ml-1">(optional)</span>
              </label>
              <textarea
                className="input resize-none h-20"
                placeholder={questType === 'bug_bounty'
                  ? 'What system/contract/site does this bounty cover? Any out-of-scope items?'
                  : 'Brief context about the quest...'}
                value={description}
                onChange={e => setDesc(e.target.value)}
              />
            </div>
          </Section>

          {/* Section 2: Requirements */}
          <Section number={2} label={questType === 'bug_bounty' ? 'What qualifies as a valid bug?' : 'Completion Requirements'}>
            <p className="text-xs text-q-muted -mt-1 mb-3">
              {questType === 'bug_bounty'
                ? 'The AI reads this to judge if a bug report is valid. Specify severity, reproducibility, and scope.'
                : 'The AI validator reads this word-for-word to decide if a submission passes. Be specific.'}
            </p>
            <textarea
              className="input resize-none h-36"
              placeholder={questType === 'bug_bounty'
                ? 'e.g.:\n• Must be a real, reproducible security vulnerability\n• Must include steps to reproduce\n• Must affect the production system\n• Duplicates will be rejected'
                : 'e.g.:\n• Must be exactly 3 lines, 5-7-5 syllables\n• Must reference blockchain technology\n• Must be original, not AI-generated'}
              value={requirements}
              onChange={e => setReqs(e.target.value)}
              required
            />
          </Section>

          {/* Section 3: Winners & Reward */}
          <Section number={3} label="Reward & Winners">
            {questType === 'bug_bounty' ? (
              <div className="flex items-center gap-3 bg-orange-400/8 border border-orange-400/20 rounded-xl px-4 py-3 text-sm text-orange-400 mb-4">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4M12 16h.01"/></svg>
                Bug bounties reward the first valid reporter only.
              </div>
            ) : (
              <div>
                <label className="label">How many winners?</label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[1, 2, 3].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMaxWinners(n)}
                      className={`py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                        maxWinners === n
                          ? 'border-q-purple/70 bg-q-purple/15 text-q-text'
                          : 'border-q-border/60 bg-q-bg text-q-muted hover:border-q-purple/30'
                      }`}
                    >
                      {n === 1 ? 'Top 1' : n === 2 ? 'Top 2' : 'Top 3'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Total Reward Pool</label>
              <div className="flex items-center gap-2">
                <input
                  className="input w-32 text-lg font-bold tabular-nums"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={rewardGEN}
                  onChange={e => setReward(e.target.value)}
                  required
                />
                <span className="text-sm font-bold text-q-gold">GEN</span>
              </div>
            </div>

            {/* Reward split preview */}
            {rewardBigint > 0 && (
              <div className="bg-q-bg rounded-xl border border-q-border/60 p-3 space-y-2">
                <p className="text-[11px] text-q-muted font-semibold uppercase tracking-wider">Prize Breakdown</p>
                {splits.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${s.color}`}>{s.label}</span>
                    <span className="text-sm text-q-text tabular-nums">
                      {formatGEN(rewardBigint * BigInt(s.pct) / BigInt(100))} GEN
                      <span className="text-q-muted text-xs ml-1">({s.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-start gap-2 bg-q-red/8 border border-q-red/25 rounded-xl px-4 py-3 text-q-red text-sm">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  {error}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <button type="button" onClick={() => navigate(-1)} disabled={busy} className="btn-ghost px-6">
              Cancel
            </button>
            <button type="submit" disabled={busy} className={`px-8 py-3 ${questType === 'bug_bounty' ? 'btn-orange' : 'btn-primary'}`}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {questType === 'bug_bounty'
                    ? <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M12 22c4.97 0 9-4.03 9-9H3c0 4.97 4.03 9 9 9z"/></svg> Submit Bug Bounty</>
                    : <><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg> Submit Quest</>
                  }
                  <strong className="text-q-gold">— {rewardGEN} GEN locked</strong>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}

function TypeButton({ active, onClick, icon, label, desc, accent = 'purple' }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string; accent?: string
}) {
  const activeClass = accent === 'orange'
    ? 'border-orange-400/60 bg-orange-400/10 text-q-text'
    : 'border-q-purple/60 bg-q-purple/10 text-q-text'
  const iconClass = accent === 'orange' ? 'text-orange-400' : 'text-q-purple'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${
        active ? activeClass : 'border-q-border/60 text-q-muted hover:border-q-border hover:text-q-text'
      }`}
    >
      <span className={active ? iconClass : 'text-q-muted'}>{icon}</span>
      <div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-q-muted mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </button>
  )
}

function Section({ number, label, children }: { number: number; label: string; children: React.ReactNode }) {
  return (
    <div className="bg-q-surface rounded-2xl px-6 py-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <span className="w-6 h-6 rounded-full bg-q-purple/15 border border-q-purple/30 flex items-center justify-center text-[11px] font-bold text-q-purple flex-shrink-0">
          {number}
        </span>
        <span className="text-sm font-semibold text-q-text">{label}</span>
      </div>
      {children}
    </div>
  )
}
