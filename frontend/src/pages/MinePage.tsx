import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAllQuests, useMySubmissions } from '../hooks/useQuests'
import { MyDashboard } from '../components/MyDashboard'
import { PageTransition } from '../components/PageTransition'
import { PageHeader } from './AllQuestsPage'

interface Props { address: string | null; onOpenPicker: () => void }

export function MinePage({ address, onOpenPicker }: Props) {
  const navigate = useNavigate()
  const { quests, loading } = useAllQuests()

  const questIds = useMemo(() => quests.map(q => q.id), [quests])
  const { items: mySubmissionItems, loading: subsLoading } = useMySubmissions(address, questIds)

  if (!address) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
          >
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-q-text font-bold text-xl mb-2">Connect your wallet</h2>
            <p className="text-quest-muted text-sm mb-6">Connect to see your quests and submissions.</p>
            <button className="btn-primary" onClick={onOpenPicker}>Connect Wallet</button>
          </motion.div>
        </div>
      </PageTransition>
    )
  }

  const myCount = quests.filter(q => q.creator.toLowerCase() === address.toLowerCase() && (q.active || q.completed)).length

  return (
    <PageTransition>
      <PageHeader title="My Quests" sub={loading ? 'Loading…' : `${myCount} posted`} />
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card animate-pulse h-16" />)}
        </div>
      ) : (
        <MyDashboard
          allQuests={quests}
          address={address}
          submissionItems={mySubmissionItems}
          subsLoading={subsLoading}
          onSelectQuest={id => navigate(`/quest/${id}`)}
        />
      )}
    </PageTransition>
  )
}
