import type { Quest } from '../types'
import { formatGEN, shortAddr } from '../hooks/useTx'
import { CategoryBadge } from './CategoryBadge'

interface Props {
  quest: Quest
  onClick: () => void
}

export function QuestCard({ quest, onClick }: Props) {
  return (
    <button
      className="card w-full text-left hover:border-quest-purple transition-all duration-150 hover:shadow-lg hover:shadow-quest-purple/10 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <StatusBadge quest={quest} />
            <CategoryBadge category={quest.category ?? 'other'} size="xs" />
            <span className="text-xs text-quest-muted font-mono">#{quest.id}</span>
          </div>
          <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2">{quest.title}</h3>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-quest-gold font-bold text-lg leading-none">{formatGEN(quest.reward)}</div>
          <div className="text-quest-muted text-xs">GEN</div>
        </div>
      </div>

      {quest.description && (
        <p className="text-xs text-quest-muted line-clamp-2 mb-3 leading-relaxed">{quest.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-quest-muted">
        <span>by {shortAddr(quest.creator)}</span>
        {quest.winner && (
          <span className="text-quest-green">Won by {shortAddr(quest.winner)}</span>
        )}
        {quest.appealed && !quest.winner && (
          <span className="text-quest-gold">Appealed — Reopened</span>
        )}
      </div>
    </button>
  )
}

function StatusBadge({ quest }: { quest: Quest }) {
  if (quest.completed)
    return <span className="px-1.5 py-0.5 rounded-full bg-quest-green/10 text-quest-green text-[10px] border border-quest-green/30">Done</span>
  if (!quest.active)
    return <span className="px-1.5 py-0.5 rounded-full bg-quest-muted/10 text-quest-muted text-[10px] border border-quest-muted/30">Cancelled</span>
  return <span className="px-1.5 py-0.5 rounded-full bg-quest-purple/10 text-quest-purple text-[10px] border border-quest-purple/30 animate-pulse">Active</span>
}
