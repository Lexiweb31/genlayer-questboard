import { useState, type FormEvent } from 'react'
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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!busy ? onClose : undefined} />

      <div className="relative card w-full max-w-xl z-10 shadow-2xl border-quest-purple/40 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-quest-gold">Post New Quest</h2>
          {!busy && (
            <button className="text-quest-muted hover:text-white transition-colors" onClick={onClose}>✕</button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all duration-100 capitalize ${
                      active
                        ? `${meta.color} font-semibold`
                        : 'border-quest-border text-quest-muted hover:border-quest-purple hover:text-white'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input resize-none h-16"
              placeholder="Optional — brief context about the quest..."
              value={description}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Completion Requirements</label>
            <textarea
              className="input resize-none h-28"
              placeholder={
                "List exactly what the submitter must do.\n" +
                "Be specific — the AI judge uses this word-for-word.\n\n" +
                "e.g.:\n• Must be exactly 3 lines, 5-7-5 syllables\n• Must reference blockchain\n• Must be original"
              }
              value={requirements}
              onChange={e => setReqs(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Reward (GEN)</label>
            <div className="flex items-center gap-2">
              <input
                className="input w-36"
                type="number"
                step="0.0001"
                min="0.0001"
                value={rewardGEN}
                onChange={e => setReward(e.target.value)}
                required
              />
              <span className="text-quest-gold font-bold">GEN</span>
            </div>
            <p className="text-xs text-quest-muted mt-1">
              Locked in the contract until completed or cancelled.
            </p>
          </div>

          {error && (
            <div className="bg-quest-red/10 border border-quest-red/30 rounded-lg px-3 py-2 text-quest-red text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="btn-gold flex-1" disabled={busy}>
              {busy ? 'Posting Quest…' : `Post Quest — Lock ${rewardGEN} GEN`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
