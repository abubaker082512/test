import { getCrashState, updateCrashState } from '../../../utils/firebaseDb'

// A simple RNG that ensures 40% win rate
function generateCrashTarget() {
  const isWin = Math.random() <= 0.40; // 40% Win
  if (!isWin) return 1.00; // Instant crash (Loss)
  
  // Win curve (1.10x up to ~10.00x)
  return parseFloat(Math.max(1.10, 1 + (Math.random() * 5)).toFixed(2));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    // 1. Read current state
    const currentState = await getCrashState()

    if (!currentState) {
      return res.status(500).json({ error: 'Crash state not initialized in DB' })
    }

    if (currentState.status === 'waiting' || currentState.phase === 'betting') {
      // START THE ROUND
      const target = generateCrashTarget()
      
      // Update DB to 'running'
      await updateCrashState({
        status: 'running',
        phase: 'running',
        multiplier: 1.00,
        crashed: false
      })

      setTimeout(async () => {
        await updateCrashState({
          status: 'crashed',
          phase: 'crashed',
          multiplier: target,
          crashed: true
        })

        // Reset back to waiting after 5 seconds
        setTimeout(async () => {
          await updateCrashState({
            status: 'waiting',
            phase: 'betting',
            multiplier: 1.00,
            crashed: false
          })
        }, 5000)

      }, 2000) // 2 second mock run

      return res.status(200).json({ message: 'Round started' })
    }

    return res.status(200).json({ message: 'Already running' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}
