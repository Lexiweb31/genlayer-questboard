import { motion } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  onDone: () => void
}

export function SplashScreen({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: '#08090E' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      {/* Ambient glow behind logo */}
      <motion.div
        className="absolute w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1.2, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Hex logo mark */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)]"
            style={{ background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <motion.path
                d="M12 2L22 7v10L12 22 2 17V7L12 2z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
                fill="rgba(255,255,255,0.15)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              />
              <motion.path
                d="M12 2v20M2 7l10 5 10-5M2 17l10-5 10 5"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="0.8"
                fill="none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              />
            </svg>
          </div>
        </motion.div>

        {/* Word mark */}
        <div className="flex flex-col items-center gap-1 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
            className="text-3xl font-bold tracking-tight text-white"
          >
            QuestBoard
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85, duration: 0.5 }}
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: '#6366F1' }}
          >
            Powered by GenLayer
          </motion.div>
        </div>

        {/* Loading bar */}
        <motion.div
          className="w-32 h-0.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.1, duration: 1.2, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
