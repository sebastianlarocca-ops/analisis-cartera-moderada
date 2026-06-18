const colors = {
  default: { bg: 'rgba(255,255,255,0.08)', color: '#8b94a8', border: 'rgba(255,255,255,0.1)' },
  blue:    { bg: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
  green:   { bg: 'rgba(52,211,153,0.12)', color: '#34d399', border: 'rgba(52,211,153,0.25)' },
  teal:    { bg: 'rgba(45,212,191,0.12)', color: '#2dd4bf', border: 'rgba(45,212,191,0.25)' },
  red:     { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
  yellow:  { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  indigo:  { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', border: 'rgba(99,102,241,0.3)' },
}

export default function Badge({ variant = 'default', children, style: extraStyle }) {
  const c = colors[variant] || colors.default
  return (
    <span className="gbadge" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}`, ...extraStyle }}>
      {children}
    </span>
  )
}
