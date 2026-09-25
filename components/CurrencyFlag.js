import React from 'react'

export default function CurrencyFlag({ size = 18, style = {} }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: '#01411C',
        fontSize: `${Math.round(size * 0.7)}px`,
        lineHeight: 1,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
        marginRight: '4px',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style
      }}
      title="PKR"
    >
      🇵🇰
    </span>
  )
}
