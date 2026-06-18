import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { QuestDetail } from '../components/QuestDetail'
import { PageTransition } from '../components/PageTransition'
import type { useTxHistory } from '../hooks/useTxHistory'

interface Props {
  address: string | null
  writeClient: unknown
  txHistory: ReturnType<typeof useTxHistory>
}

export function QuestPage({ address, writeClient, txHistory }: Props) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const questId = Number(id)

  if (isNaN(questId)) {
    return (
      <PageTransition>
        <div className="text-center py-24 text-quest-muted">Invalid quest ID.</div>
      </PageTransition>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <QuestDetail
        questId={questId}
        address={address}
        writeClient={writeClient}
        txHistory={txHistory}
        onBack={() => navigate(-1)}
      />
    </motion.div>
  )
}
