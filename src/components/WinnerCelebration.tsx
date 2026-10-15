import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../types';

interface WinnerCelebrationProps {
  winner: Player;
  onDone: () => void;
  durationMs?: number;
}

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  kind: 'confetti' | 'spark';
};

const COLORS = ['#fbbf24', '#f472b6', '#60a5fa', '#34d399', '#f97316', '#e879f9', '#fef08a'];

export const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  winner,
  onDone,
  durationMs = 4200,
}) => {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 48 }, (_, id) => ({
        id,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.4 + Math.random() * 1.4,
        color: COLORS[id % COLORS.length],
        kind: id % 3 === 0 ? 'spark' : 'confetti',
      })),
    []
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(onDone, durationMs);
    return () => window.clearTimeout(timeoutId);
  }, [onDone, durationMs]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[140] overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute top-[-10%]"
          style={{ left: `${particle.left}%` }}
          initial={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: '120vh',
            opacity: [1, 1, 0],
            rotate: particle.kind === 'confetti' ? 360 : 0,
            scale: particle.kind === 'spark' ? [0.6, 1.2, 0.4] : 1,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'easeOut',
          }}
        >
          {particle.kind === 'spark' ? (
            <span className="text-xl">✨</span>
          ) : (
            <span
              className="block h-3 w-2 rounded-sm"
              style={{ backgroundColor: particle.color }}
            />
          )}
        </motion.div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.7, 1.08, 1], opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative rounded-3xl bg-black/50 px-6 py-5 text-center shadow-3d backdrop-blur-md"
        >
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-3xl"
            animate={{
              boxShadow: [
                '0 0 0 rgba(251,191,36,0)',
                '0 0 40px rgba(251,191,36,0.8)',
                '0 0 12px rgba(251,191,36,0.35)',
              ],
            }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <div className="relative mx-auto mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-yellow-300 bg-gradient-to-br from-pink-400 to-purple-500 text-4xl font-bold text-white">
            {winner.photo ? (
              <img src={winner.photo} alt={winner.name} className="h-full w-full object-cover" />
            ) : (
              winner.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="relative text-3xl">🎆 ⭐ 🎇</div>
          <div className="relative mt-2 text-2xl font-bold text-white">{winner.name}</div>
          <div className="relative text-sm font-semibold text-yellow-200">Set complete — star locked in!</div>
        </motion.div>
      </div>
    </div>
  );
};
