import { PageTransition } from '../components/PageTransition'
import { Leaderboard } from '../components/Leaderboard'
import { PageHeader } from './AllQuestsPage'

export function LeaderboardPage() {
  return (
    <PageTransition>
      <PageHeader title="Leaderboard" sub="Top performers across all quests" />
      <Leaderboard />
    </PageTransition>
  )
}
