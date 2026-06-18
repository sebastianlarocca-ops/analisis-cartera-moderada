export default function Input({ label, className = '', ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {label && <label className="dark-label">{label}</label>}
      <input className={`dark-input ${className}`} {...props} />
    </div>
  )
}
