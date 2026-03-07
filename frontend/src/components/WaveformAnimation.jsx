import { useEffect, useState } from 'react'

const BAR_COUNT = 28

export default function WaveformAnimation({ active = false }) {
  const [heights, setHeights] = useState(() => Array(BAR_COUNT).fill(0.3))

  useEffect(() => {
    if (!active) {
      setHeights(Array(BAR_COUNT).fill(0.15))
      return
    }

    const interval = setInterval(() => {
      setHeights(Array(BAR_COUNT).fill(0).map(() => Math.random() * 0.75 + 0.25))
    }, 80)

    return () => clearInterval(interval)
  }, [active])

  return (
    <div style={styles.container}>
      {heights.map((h, i) => (
        <div
          key={i}
          style={{
            ...styles.bar,
            height: `${h * 48}px`,
            opacity: active ? 0.7 + h * 0.3 : 0.2,
            transitionDelay: `${i * 8}ms`,
          }}
        />
      ))}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    height: 56,
  },
  bar: {
    width: 3,
    borderRadius: 2,
    background: 'var(--accent)',
    transition: 'height 0.08s ease, opacity 0.3s ease',
    flexShrink: 0,
  },
}
