import { motion } from 'framer-motion'

const foodIcons = [
  { emoji: '🍕', size: 'text-4xl', delay: 0 },
  { emoji: '🍔', size: 'text-5xl', delay: 0.5 },
  { emoji: '🍜', size: 'text-3xl', delay: 1 },
  { emoji: '🍱', size: 'text-4xl', delay: 1.5 },
  { emoji: '🍰', size: 'text-3xl', delay: 2 },
  { emoji: '🍣', size: 'text-4xl', delay: 2.5 },
]

export default function FloatingFoodIcons() {
  return (
    <>
      {/* Left side icons */}
      <div className="hidden xl:block fixed left-4 top-1/4 z-0 pointer-events-none">
        <div className="space-y-16">
          {foodIcons.slice(0, 3).map((food, i) => (
            <motion.div
              key={`left-${i}`}
              className={food.size}
              initial={{ opacity: 0, x: -50 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                x: [-20, 0, -20],
                rotate: [-10, 10, -10]
              }}
              transition={{
                duration: 4,
                delay: food.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {food.emoji}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right side icons */}
      <div className="hidden xl:block fixed right-4 top-1/3 z-0 pointer-events-none">
        <div className="space-y-16">
          {foodIcons.slice(3, 6).map((food, i) => (
            <motion.div
              key={`right-${i}`}
              className={food.size}
              initial={{ opacity: 0, x: 50 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                x: [20, 0, 20],
                rotate: [10, -10, 10]
              }}
              transition={{
                duration: 4,
                delay: food.delay,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {food.emoji}
            </motion.div>
          ))}
        </div>
      </div>
    </>
  )
}
