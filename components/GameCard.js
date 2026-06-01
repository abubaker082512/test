import React from 'react'

export default function GameCard({ title, emoji, label, onPlay }) {
  return (
    <div className="game-card">
      <div className="thumb">{emoji}</div>
      <div className="title">{title}</div>
      <div className="subtitle">{label}</div>
      {onPlay && (
        <button className="btn small" style={{ marginTop: 8 }} onClick={onPlay}>Play</button>
      )}
    </div>
  )
}
