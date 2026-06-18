import { useMemo } from 'react'
import type { Quest, Submission } from '../types'
import { formatGEN, displayName } from '../hooks/useTx'

interface Props {
  allQuests: Quest[]
  address: string
  submissionItems: { questId: number; submission: Submission }[]
  subsLoading: boolean
  onSelectQuest: (id: number) => void
}

interface MySubmission {
  quest: Quest
  submission: Submission
}

export function MyDashboard({ allQuests, address, submissionItems, subsLoading, onSelectQuest }: Props) {
  const myPostedQuests = useMemo(
    () => allQuests.filter(q => q.creator.toLowerCase() === address.toLowerCase() && (q.active || q.completed)),
    [allQuests, address],
  )

  const mySubmissions = useMemo<MySubmission[]>(() => {
    const questMap = new Map(allQuests.map(q => [q.id, q]))
    return submissionItems
      .map(({ questId, submission }) => {
        const quest = questMap.get(questId)
        return quest ? { quest, submission } : null
      })
      .filter((x): x is MySubmission => x !== null)
  }, [allQuests, submissionItems])

  const totalLocked = useMemo(
    () => myPostedQuests.filter(q => q.active && !q.completed).reduce((sum, q) => sum + BigInt(q.reward), BigInt(0)),
    [myPostedQuests],
  )
  const totalWon = useMemo(
    () => allQuests.filter(q => q.winner?.toLowerCase() === address.toLowerCase())
         .reduce((sum, q) => sum + BigInt(q.reward), BigInt(0)),
    [allQuests, address],
  )

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Quests Posted"  value={myPostedQuests.length}          color="text-quest-purple" />
        <StatCard label="GEN Locked"     value={`${formatGEN(totalLocked)} GEN`} color="text-quest-gold"   />
        <StatCard label="Submitted To"   value={subsLoading ? '…' : mySubmissions.length} color="text-q-text" />
        <StatCard label="GEN Won"        value={`${formatGEN(totalWon)} GEN`}    color="text-quest-green"  />
      </div>

      {/* My Posted Quests */}
      <section>
        <h2 className="text-sm font-semibold text-quest-muted uppercase tracking-wider mb-3">
          Quests I Posted ({myPostedQuests.length})
        </h2>
        {myPostedQuests.length === 0 ? (
          <EmptyCard msg="You haven't posted any quests yet." />
        ) : (
          <div className="space-y-3">
            {myPostedQuests.map(q => (
              <PostedQuestRow key={q.id} quest={q} onClick={() => onSelectQuest(q.id)} />
            ))}
          </div>
        )}
      </section>

      {/* My Submissions */}
      <section>
        <h2 className="text-sm font-semibold text-quest-muted uppercase tracking-wider mb-3">
          My Submissions ({mySubmissions.length})
        </h2>
        {mySubmissions.length === 0 ? (
          <EmptyCard msg="You haven't submitted proof to any quest yet." />
        ) : (
          <div className="space-y-3">
            {mySubmissions.map(({ quest, submission }) => (
              <MySubmissionRow
                key={`${quest.id}-${submission.id}`}
                quest={quest}
                submission={submission}
                onClick={() => onSelectQuest(quest.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PostedQuestRow({ quest, onClick }: { quest: Quest; onClick: () => void }) {
  return (
    <button
      className="card w-full text-left hover:border-quest-purple transition-all duration-150"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <QuestStatusDot quest={quest} />
            <span className="text-q-text font-medium truncate">{quest.title}</span>
          </div>
          <span className="text-xs text-quest-muted">Quest #{quest.id}</span>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-quest-gold font-bold">{formatGEN(quest.reward)} GEN</div>
          {quest.winner && (
            <div className="text-xs text-quest-green">Won by {displayName(quest.winner)}</div>
          )}
        </div>
      </div>
    </button>
  )
}

function MySubmissionRow({
  quest, submission, onClick,
}: { quest: Quest; submission: Submission; onClick: () => void }) {
  return (
    <button
      className={`card w-full text-left hover:border-quest-purple transition-all duration-150 ${
        submission.approved ? 'border-quest-green/40' :
        submission.evaluated ? 'border-quest-red/30' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SubStatusDot sub={submission} />
            <span className="text-q-text font-medium truncate text-sm">{quest.title}</span>
          </div>
          <p className="text-xs text-quest-muted line-clamp-1">{submission.proof}</p>
          {submission.reason && (
            <p className="text-xs mt-1 italic text-quest-muted line-clamp-1">
              AI: {submission.reason}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <SubBadge sub={submission} />
          {submission.approved && (
            <div className="text-xs text-quest-gold mt-1">{formatGEN(quest.reward)} GEN</div>
          )}
        </div>
      </div>
    </button>
  )
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="card text-center py-4">
      <div className={`text-xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-xs text-quest-muted">{label}</div>
    </div>
  )
}

function EmptyCard({ msg }: { msg: string }) {
  return (
    <div className="card text-center py-8 text-quest-muted text-sm border-dashed">{msg}</div>
  )
}

function QuestStatusDot({ quest }: { quest: Quest }) {
  if (quest.completed) return <span className="w-2 h-2 rounded-full bg-quest-green flex-shrink-0" />
  if (!quest.active)   return <span className="w-2 h-2 rounded-full bg-quest-muted flex-shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-quest-purple animate-pulse flex-shrink-0" />
}

function SubStatusDot({ sub }: { sub: Submission }) {
  if (!sub.evaluated) return <span className="w-2 h-2 rounded-full bg-quest-muted flex-shrink-0" />
  if (sub.approved)   return <span className="w-2 h-2 rounded-full bg-quest-green flex-shrink-0" />
  return <span className="w-2 h-2 rounded-full bg-quest-red flex-shrink-0" />
}

function SubBadge({ sub }: { sub: Submission }) {
  if (!sub.evaluated)
    return <span className="text-xs text-quest-muted border border-quest-border px-2 py-0.5 rounded-full">Pending</span>
  if (sub.approved)
    return <span className="text-xs text-quest-green border border-quest-green/30 bg-quest-green/10 px-2 py-0.5 rounded-full">Won</span>
  return <span className="text-xs text-quest-red border border-quest-red/30 bg-quest-red/10 px-2 py-0.5 rounded-full">Rejected</span>
}
