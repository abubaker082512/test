import React, { useState, useEffect } from 'react'

const FISH_SPECIES = [
  { id: 'clown', name: 'Nemo Clownfish 🐠', hp: 3, multiplier: 1.5, color: '#ff5722' },
  { id: 'jelly', name: 'Shock Jellyfish 👾', hp: 5, multiplier: 3.0, color: '#ab47bc' },
  { id: 'turtle', name: 'Ancient Turtle 🐢', hp: 8, multiplier: 8.0, color: '#4caf50' },
  { id: 'shark', name: 'Great White Shark 🦈', hp: 15, multiplier: 25.0, color: '#0288d1' },
  { id: 'dragon', name: 'BOSS Golden Dragon 🐉', hp: 40, multiplier: 100.0, color: '#ffea00' }
]

export default function FishHunterGame({ user, wallet, fetchWallet }) {
  const [weaponPower, setWeaponPower] = useState(10)
  const [fishList, setFishList] = useState([])
  const [selectedFishIdx, setSelectedFishIdx] = useState(0)
  const [firing, setFiring] = useState(false)
  const [message, setMessage] = useState(null)
  const [processing, setProcessing] = useState(false)
  
  // Harpoon animations
  const [harpoonLeft, setHarpoonLeft] = useState(50)
  const [harpoonBottom, setHarpoonBottom] = useState(10)
  const [harpoonVisible, setHarpoonVisible] = useState(false)

  // Populate active fish in the aquarium
  const populateAquarium = () => {
    // Generate 4 random fish from species list
    const initial = Array(4).fill(null).map((_, idx) => {
      const species = FISH_SPECIES[Math.floor(Math.random() * (FISH_SPECIES.length - 1))] // exclude dragon from standard spots
      return {
        ...species,
        currentHp: species.hp,
        x: 15 + idx * 22, // space them out
        y: 20 + Math.random() * 25
      }
    })
    
    // 25% chance of spawning the BOSS Golden Dragon
    if (Math.random() < 0.25) {
      initial[3] = {
        ...FISH_SPECIES[4],
        currentHp: FISH_SPECIES[4].hp,
        x: 75,
        y: 15
      }
    }
    
    setFishList(initial)
    setSelectedFishIdx(0)
  }

  useEffect(() => {
    populateAquarium()
  }, [])

  const fireHarpoon = async () => {
    if (fishList.length === 0 || firing || processing) return
    if (!wallet || wallet.balance < weaponPower) {
      return setMessage({ type: 'error', text: 'Insufficient balance! Buy more weapon power.' })
    }

    setFiring(true)
    setProcessing(true)
    setMessage(null)

    // 1. Place bet (weapon firing cost)
    try {
      const res = await fetch('/api/wallet/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount: weaponPower })
      })
      const data = await res.json()
      if (!data.success) {
        setFiring(false)
        setProcessing(false)
        return setMessage({ type: 'error', text: data.error || 'Harpoon lock failed.' })
      }
      fetchWallet()
    } catch (e) {
      setFiring(false)
      setProcessing(false)
      return setMessage({ type: 'error', text: 'Network connection error.' })
    }

    // 2. Animate harpoon flying
    const target = fishList[selectedFishIdx]
    setHarpoonVisible(true)
    setHarpoonLeft(50)
    setHarpoonBottom(10)

    // Travel path
    setTimeout(() => {
      setHarpoonLeft(target.x)
      setHarpoonBottom(80 - target.y)
    }, 50)

    // Strike collision
    setTimeout(async () => {
      setHarpoonVisible(false)
      
      // Inflict damage (1 power = 1 damage)
      const nextList = [...fishList]
      const currentFish = nextList[selectedFishIdx]
      currentFish.currentHp = Math.max(0, currentFish.currentHp - 1)
      setFishList(nextList)

      if (currentFish.currentHp <= 0) {
        // Fish captured!
        const winAmount = currentFish.multiplier * weaponPower
        
        try {
          const payRes = await fetch('/api/wallet/payout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              bet_amount: weaponPower,
              multiplier: currentFish.multiplier
            })
          })
          const payData = await payRes.json()
          if (payData.success) {
            setMessage({
              type: 'success',
              text: `🎯 CAPTURED! Defeated ${currentFish.name}. Won ₱${winAmount.toFixed(2)} (${currentFish.multiplier}x)`
            })
          }
        } catch (e) {
          setMessage({ type: 'error', text: 'Failed to credit capture winnings.' })
        }

        // Replace captured fish
        setTimeout(() => {
          const species = FISH_SPECIES[Math.floor(Math.random() * FISH_SPECIES.length)]
          nextList[selectedFishIdx] = {
            ...species,
            currentHp: species.hp,
            x: currentFish.x,
            y: 15 + Math.random() * 25
          }
          setFishList([...nextList])
        }, 1200)

      } else {
        setMessage({
          type: 'success',
          text: `💥 HIT! Direct strike on ${currentFish.name}. HP left: ${currentFish.currentHp}/${currentFish.hp}`
        })
      }

      setFiring(false)
      setProcessing(false)
      fetchWallet()
    }, 600)
  }

  const switchTarget = (idx) => {
    if (firing) return
    setSelectedFishIdx(idx)
    setMessage(null)
  }

  const renderAquarium = () => {
    return (
      <div style={{
        height: '240px',
        background: 'radial-gradient(circle, #0288d1 0%, #013352 100%)', // Deep ocean water gradient
        border: '3px solid #ffea00',
        borderRadius: '12px',
        position: 'relative',
        marginBottom: '20px',
        overflow: 'hidden',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)'
      }}>
        {/* Floating bubble background particles */}
        <div style={{ position: 'absolute', top: '10%', left: '25%', fontSize: '12px', opacity: 0.3, animation: 'pulse 3s infinite alternate' }}>🫧</div>
        <div style={{ position: 'absolute', top: '40%', left: '75%', fontSize: '18px', opacity: 0.2, animation: 'pulse 4s infinite alternate' }}>🫧</div>
        <div style={{ position: 'absolute', top: '65%', left: '10%', fontSize: '10px', opacity: 0.4, animation: 'pulse 2s infinite alternate' }}>🫧</div>

        {/* Fish List */}
        {fishList.map((fish, idx) => {
          const isSelected = selectedFishIdx === idx
          const hpPercent = (fish.currentHp / fish.hp) * 100

          return (
            <div
              key={idx}
              onClick={() => switchTarget(idx)}
              style={{
                position: 'absolute',
                left: `${fish.x}%`,
                top: `${fish.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                zIndex: isSelected ? 5 : 2,
                transition: 'all 0.3s ease-out'
              }}
            >
              {/* Target Indicator crosshair overlay */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  width: '42px',
                  height: '42px',
                  border: '2px dashed #ffea00',
                  borderRadius: '50%',
                  top: '8px',
                  animation: 'spin-slow 4s linear infinite',
                  pointerEvents: 'none'
                }}></div>
              )}

              {/* Fish Sprite Graphic */}
              <div style={{
                fontSize: fish.id === 'dragon' ? '46px' : '36px',
                filter: isSelected ? 'drop-shadow(0 0 8px #ffea00)' : 'none',
                transition: 'transform 0.1s'
              }}>
                {fish.name.split(' ').pop()}
              </div>

              {/* HP Bar */}
              <div style={{
                width: '40px',
                height: '4px',
                background: '#444',
                borderRadius: '2px',
                border: '1px solid #111',
                marginTop: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${hpPercent}%`,
                  height: '100%',
                  background: fish.id === 'dragon' ? '#ffea00' : '#ff1744'
                }}></div>
              </div>

              {/* HP Numbers */}
              <span style={{ fontSize: '8px', color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {fish.currentHp}/{fish.hp}
              </span>
            </div>
          )
        })}

        {/* Gun Turret Cannon at bottom-center */}
        <div style={{
          position: 'absolute',
          bottom: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '50px',
          height: '50px',
          background: 'radial-gradient(circle, #555 0%, #222 100%)',
          borderRadius: '50% 50% 0 0',
          border: '2px solid #888',
          zIndex: 3
        }}>
          {/* Turret Barrel pointing at target */}
          <div style={{
            width: '8px',
            height: '24px',
            background: '#ffea00',
            position: 'absolute',
            top: '-16px',
            left: '19px',
            borderRadius: '4px 4px 0 0',
            transformOrigin: 'bottom center',
            transform: `rotate(${(selectedFishIdx - 1.5) * 25}deg)`,
            transition: 'transform 0.3s ease-out'
          }}></div>
        </div>

        {/* Traveling Harpoon Bullet */}
        {harpoonVisible && (
          <div style={{
            position: 'absolute',
            left: `${harpoonLeft}%`,
            bottom: `${harpoonBottom}%`,
            transform: 'translate(-50%, 50%) rotate(45deg)',
            fontSize: '18px',
            transition: 'all 0.5s linear',
            zIndex: 4
          }}>
            🔱
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'linear-gradient(180deg, #011627 0%, #010810 100%)', // Underwater Deep Blue
      width: '100%',
      minHeight: '100%',
      overflowY: 'auto'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '520px',
        background: 'rgba(0, 0, 0, 0.55)',
        border: '2px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '22px',
          fontWeight: '900',
          color: '#ffea00',
          letterSpacing: '1px',
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          marginBottom: '16px'
        }}>🦈 FISH HUNTER</h2>

        {/* Fish Species Payout Reference */}
        <div style={{
          background: '#010c14',
          border: '1px solid #0288d1',
          borderRadius: '8px',
          padding: '6px 8px',
          fontSize: '9px',
          color: '#ccc',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '2px',
          marginBottom: '16px',
          fontFamily: 'monospace'
        }}>
          <div>🐠 1.5x</div>
          <div>👾 3x</div>
          <div>🐢 8x</div>
          <div>🦈 25x</div>
          <div style={{ color: '#ffea00' }}>🐉 100x</div>
        </div>

        {/* Ocean Aquarium Panel */}
        {renderAquarium()}

        {message && (
          <div style={{
            background: message.type === 'success' ? 'rgba(0,230,118,0.1)' : 'rgba(255,23,68,0.1)',
            border: `1px solid ${message.type === 'success' ? 'rgba(0,230,118,0.2)' : 'rgba(255,23,68,0.2)'}`,
            padding: '10px',
            borderRadius: '8px',
            color: message.type === 'success' ? '#00e676' : '#ff1744',
            fontSize: '11px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            {message.text}
          </div>
        )}

        {/* Stake Adjustment & Launch Controller */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
            <button
              disabled={firing}
              onClick={() => setWeaponPower(Math.max(10, weaponPower - 10))}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#022138', color: '#fff', border: '1px solid #0288d1', fontWeight: 'bold', cursor: 'pointer' }}
            >
              -
            </button>
            <div style={{
              flex: 1,
              background: '#010f1a',
              border: '1px solid #0288d1',
              borderRadius: '8px',
              color: '#fff',
              lineHeight: '34px',
              fontWeight: 'bold',
              fontSize: '13px'
            }}>
              ₱{weaponPower}
            </div>
            <button
              disabled={firing}
              onClick={() => setWeaponPower(weaponPower + 10)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#022138', color: '#fff', border: '1px solid #0288d1', fontWeight: 'bold', cursor: 'pointer' }}
            >
              +
            </button>
          </div>

          <button
            onClick={fireHarpoon}
            disabled={firing || processing || fishList.length === 0}
            style={{
              flex: 1.2,
              background: 'linear-gradient(90deg, #ffea00 0%, #0288d1 100%)',
              color: '#000',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: '950',
              fontSize: '13px',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              boxShadow: '0 4px 15px rgba(2, 136, 209, 0.3)'
            }}
          >
            {firing ? 'LAUNCHING...' : 'FIRE HARPOON'}
          </button>
        </div>
      </div>
    </div>
  )
}
