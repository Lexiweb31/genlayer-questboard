export type Category = 'creative' | 'technical' | 'research' | 'social' | 'gaming' | 'other'

export const CATEGORIES: Category[] = ['creative', 'technical', 'research', 'social', 'gaming', 'other']

export const CATEGORY_META: Record<Category, { icon: string; color: string }> = {
  creative:  { icon: '🎨', color: 'text-pink-400 border-pink-400/30 bg-pink-400/10' },
  technical: { icon: '⚙️', color: 'text-blue-400 border-blue-400/30 bg-blue-400/10' },
  research:  { icon: '🔬', color: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10' },
  social:    { icon: '🌐', color: 'text-green-400 border-green-400/30 bg-green-400/10' },
  gaming:    { icon: '🎮', color: 'text-quest-purple border-quest-purple/30 bg-quest-purple/10' },
  other:     { icon: '✦',  color: 'text-quest-muted border-quest-border bg-quest-surface' },
}

export interface Quest {
  id: number
  creator: string
  title: string
  description: string
  requirements: string
  category: Category
  reward: string
  active: boolean
  completed: boolean
  winner: string | null
  appealed?: boolean
}

export interface Submission {
  id: number
  submitter: string
  proof: string
  evaluated: boolean
  approved: boolean
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
