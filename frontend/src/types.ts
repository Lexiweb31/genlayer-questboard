export type Category = 'creative' | 'technical' | 'research' | 'social' | 'gaming' | 'bug_bounty' | 'other'
export type QuestType = 'task' | 'bug_bounty'
export type ProofPlatform = 'x' | 'medium' | 'github' | 'other'

export const CATEGORIES: Category[] = ['creative', 'technical', 'research', 'social', 'gaming', 'bug_bounty', 'other']

export const CATEGORY_META: Record<Category, { icon: string; color: string }> = {
  creative:   { icon: '🎨', color: 'text-pink-400 border-pink-400/30 bg-pink-400/10' },
  technical:  { icon: '⚙️', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  research:   { icon: '🔬', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
  social:     { icon: '🌐', color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  gaming:     { icon: '🎮', color: 'text-quest-purple border-quest-purple/30 bg-quest-purple/10' },
  bug_bounty: { icon: '🐛', color: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  other:      { icon: '✦',  color: 'text-quest-muted border-quest-border bg-quest-surface' },
}

export interface Quest {
  id: number
  creator: string
  title: string
  description: string
  requirements: string
  category: Category
  quest_type: QuestType
  reward: string | number | bigint
  paid_out?: string | number | bigint
  max_winners: number
  winner_count: number
  reward_per_rank: (string | number | bigint)[]
  active: boolean
  completed: boolean
  winner: string | null
  appealed?: boolean
}

export interface Submission {
  id: number
  submitter: string
  proof: string
  proof_url: string
  proof_platform: ProofPlatform
  evaluated: boolean
  approved: boolean
  rank: number
  reason: string
  appealed: boolean
  appeal_resolved: boolean
  appeal_overturned: boolean
  appeal_reason?: string
  appeal_result_reason?: string
}

export interface LeaderboardEntry {
  address: string
  quests_won: number
  total_gen_won: number
}

export interface CreatorEntry {
  address: string
  quests_posted: number
  total_gen_posted: number
  quests_completed: number
}

export type TxStatus = 'idle' | 'pending' | 'success' | 'error'

export const PLATFORM_META: Record<ProofPlatform, { label: string; icon: string; placeholder: string }> = {
  x:      { label: 'X (Twitter)', icon: '𝕏', placeholder: 'https://x.com/yourhandle/status/...' },
  medium: { label: 'Medium',      icon: 'M', placeholder: 'https://medium.com/@you/your-post-...' },
  github: { label: 'GitHub',      icon: '⌥', placeholder: 'https://github.com/you/repo/issues/...' },
  other:  { label: 'Other / Link',icon: '🔗', placeholder: 'https://...' },
}

export const RANK_LABELS = ['🥇 1st Place', '🥈 2nd Place', '🥉 3rd Place']
export const RANK_COLORS = [
  'text-q-gold border-q-gold/40 bg-q-gold/10',
  'text-slate-300 border-slate-400/30 bg-slate-400/10',
  'text-orange-400 border-orange-400/30 bg-orange-400/10',
]
