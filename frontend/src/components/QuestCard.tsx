import type { Quest } from '../types'
import { formatGEN, displayName } from '../hooks/useTx'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  quest: Quest
  onClick: () => void
}

export function QuestCard({ quest, onClick }: Props) {
  const isBugBounty = quest.quest_type === 'bug_bounty'

  return (
    <button
      className="card-hover w-full text-left cursor-pointer group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-q-purple/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Top row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <StatusBadge quest={quest} />
        <CategoryBadge category={quest.category ?? 'other'} size="xs" />
        {isBugBounty && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-orange-400/30 bg-orange-400/10 text-orange-400 font-medium">Bug</span>
        )}
        <span className="text-[11px] text-q-muted/50 font-mono ml-auto">#{quest.id}</span>
      </div>

      {/* Title */}
      <h3 className="text-q-text font-semibold text-[15px] leading-snug line-clamp-2 mb-2.5 group-hover:text-q-purple transition-colors duration-200">
        {quest.title}
      </h3>

      {/* Description */}
      {quest.description && (
        <p className="text-xs text-q-muted line-clamp-2 leading-relaxed mb-4">{quest.description}</p>
      )}

      {/* Footer */}
      <div className="flex items-end justify-between gap-2 mt-auto pt-3 border-t border-q-border/50">
        <span className="text-xs text-q-muted">
          by <span className="font-mono text-q-subtle">{displayName(quest.creator)}</span>
        </span>
        <div className="text-right">
          <div className="text-q-gold font-bold text-lg leading-none tabular-nums">
            {formatGEN(quest.reward)}
          </div>
          <div className="text-q-muted text-[10px] uppercase tracking-wide">GEN</div>
        </div>
      </div>

      {quest.winner && (
        <div className="mt-2 text-xs text-q-green font-medium">
          Won by <span className="font-mono">{displayName(quest.winner)}</span>
        </div>
      )}
    </button>
  )
}

function StatusBadge({ quest }: { quest: Quest }) {
  if (quest.completed)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-q-green/30 bg-q-green/10 text-q-green">
        <span className="w-1 h-1 rounded-full bg-q-green" />Done
      </span>
    )
  if (!quest.active)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-q-muted/30 bg-q-muted/10 text-q-muted">
        Cancelled
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-q-purple/35 bg-q-purple/12 text-q-purple">
      <span className="w-1 h-1 rounded-full bg-q-purple animate-pulse" />Active
    </span>
  )
}
