import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
// For backend server routes, we need the SERVICE_ROLE_KEY to bypass RLS, 
// but since we only have Anon Key right now for demo purposes, we'll use it.
// In a real production app, this should be the SUPABASE_SERVICE_ROLE_KEY.
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_key'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
    const { data: currentState } = await supabase.from('crash_state').select('*').eq('id', 1).single()

    if (!currentState) {
      return res.status(500).json({ error: 'Crash state not initialized in DB' })
    }

    if (currentState.status === 'waiting') {
      // START THE ROUND
      const target = generateCrashTarget()
      
      // Update DB to 'running'
      await supabase.from('crash_state').update({
        status: 'running',
        multiplier: 1.00
      }).eq('id', 1)

      // In a serverless environment, we can't reliably run a `setInterval` loop that lasts 10 seconds.
      // For this demo, we will simulate the crash instantly on the backend, 
      // but in a production setup, you would use a dedicated Node.js worker.
      // Here, we just instantly skip to the crash point for Vercel compatibility.
      setTimeout(async () => {
        await supabase.from('crash_state').update({
          status: 'crashed',
          multiplier: target
        }).eq('id', 1)

        // Reset back to waiting after 5 seconds
        setTimeout(async () => {
          await supabase.from('crash_state').update({
            status: 'waiting',
            multiplier: 1.00
          }).eq('id', 1)
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
