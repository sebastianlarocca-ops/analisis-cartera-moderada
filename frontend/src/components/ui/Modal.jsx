import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, className = '' }) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className={`glass ${className}`} style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#717c91', padding: 2, lineHeight: 1, transition: 'color .18s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.color = '#717c91'}>
            <X size={17} />
          </button>
        </div>
        <div style={{ padding: '18px 20px 20px' }}>{children}</div>
      </div>
    </div>
  )
}
