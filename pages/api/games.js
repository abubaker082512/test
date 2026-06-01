// Mock API endpoint to emulate RapidAPI/Jili game catalog
export default function handler(req, res) {
  const liveMode = req.query.live === 'true';
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';
  if (liveMode) {
    // Placeholder: real live data endpoint should be wired here
    res.status(501).json({ ok: false, error: 'Live data endpoint not configured yet' })
    return
  }
  if (!useMock) {
    // If mock is off but no live endpoint configured, return empty dataset gracefully
    res.status(200).json({ ok: true, data: [] })
    return
  }
  const games = [
    { id: 'g1', name: 'Fortune Ace Deluxe', category: 'Slots', provider: 'Jili', spins: 1000 },
    { id: 'g2', name: 'Super Ace', category: 'Slots', provider: 'Jili', spins: 800 },
    { id: 'g3', name: 'Fortune Gems', category: 'Slots', provider: 'Jili', spins: 1200 },
    { id: 'g4', name: 'Mine Rush', category: 'Mines', provider: 'Jili', spins: 600 }
  ]
  res.status(200).json({ ok: true, data: games })
}
