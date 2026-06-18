import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTx, parseGEN } from '../hooks/useTx'
import { CATEGORIES, CATEGORY_META, type Category } from '../types'

interface Props {
  writeClient: unknown
  onClose: () => void
  onCreated: (hash: string) => void
}

export function CreateQuestModal({ writeClient, onClose, onCreated }: Props) {
  const [title, setTitle]       = useState('')
  const [description, setDesc]  = useState('')
  const [requirements, setReqs] = useState('')
  const [rewardGEN, setReward]  = useState('1')
  const [category, setCategory] = useState<Category>('other')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { send, status, error, txHash } = useTx(writeClient as any)
  const busy = status === 'pending'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const value = parseGEN(rewardGEN)
      await send('create_quest', [title, description, requirements, category], value)
      onCreated(txHash ?? '')
      onClose()
    } catch {
      // error shown via useTx
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={!busy ? onClose : undefined}
      />

      <motion.div
        className="relative w-full max-w-xl z-10 max-h-[90vh] overflow-y-auto rounded-2xl border border-q-border shadow-2xl bg-q-surface"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        {/* Header with gradient strip */}
        <div className="relative overflow-hidden rounded-t-2xl px-6 pt-6 pb-5 border-b border-q-border">
          <div className="absolute inset-0 bg-gradient-to-r from-q-purple/10 via-transparent to-q-gold/5 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-q-purple/40 via-q-border to-transparent" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-sm flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-q-text">Post New Quest</h2>
                <p className="text-[11px] text-q-muted mt-0.5">AI validators will judge every submission</p>
              </div>
            </div>
            {!busy && (
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center text-q-muted hover:text-q-text hover:bg-q-border/50 transition-all text-xs"
                onClick={onClose}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Title */}
          <div>
            <label className="label">Quest Title</label>
            <input
              className="input"
              placeholder="e.g. Write a Haiku about Blockchain"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => {
                const meta = CATEGORY_META[cat]
                const active = category === cat
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`relative flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 capitalize overflow-hidden ${
                      active
                        ? 'border-q-purple/70 text-white bg-q-purple/15'
                        : 'border-q-border/70 text-q-muted bg-q-bg hover:border-q-purple/40 hover:text-q-subtle hover:bg-q-purple/5'
                    }`}
                  >
                    <span className="relative z-10">{meta.icon}</span>
                    <span className="relative z-10">{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                    {active && <span className="ml-auto relative z-10 w-1.5 h-1.5 rounded-full bg-q-purple flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description <span className="normal-case font-normal text-q-muted/60">(optional)</span></label>
            <textarea
              className="input resize-none h-16"
              placeholder="Brief context about the quest..."
              value={description}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="label">Completion Requirements</label>
            <div className="relative">
              <textarea
                className="input resize-none h-28"
                placeholder={
                  "List exactly what the submitter must do.\n" +
                  "Be specific — the AI judge uses this word-for-word.\n\n" +
                  "e.g.:\n• Must be exactly 3 lines, 5-7-5 syllables\n• Must reference blockchain"
                }
                value={requirements}
                onChange={e => setReqs(e.target.value)}
                required
              />
              <div className="absolute top-2 right-2">
                <span className="flex items-center gap-1 text-[10px] text-q-purple/70 bg-q-purple/8 border border-q-purple/20 rounded-md px-1.5 py-0.5">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4M12 16h.01"/></svg>
                  AI reads this
                </span>
              </div>
            </div>
          </div>

          {/* Reward */}
          <div>
            <label className="label">Reward (GEN)</label>
            <div className="flex items-center gap-3">
              <div className="relative w-40">
                <input
                  className="input pr-14 tabular-nums font-semibold"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={rewardGEN}
                  onChange={e => setReward(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-q-gold pointer-events-none">GEN</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-q-muted">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="11" width="18" height="11" rx="2"/><path strokeLinecap="round" d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Locked until completed or cancelled
              </div>
            </div>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-q-red/8 border border-q-red/25 rounded-xl px-4 py-3 text-q-red text-sm flex items-start gap-2"
              >
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-1 border-t border-q-border">
            <button type="button" className="btn-ghost flex-none px-5" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                  Posting Quest…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M13 2L4.5 13.5H12L11 22l8.5-11.5H12L13 2z"/></svg>
                  Post Quest — Lock <span className="text-q-gold font-bold">{rewardGEN} GEN</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
