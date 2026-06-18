export default function Button({ variant = 'default', size, className = '', children, ...props }) {
  const cls = (variant === 'outline' || variant === 'ghost') ? 'btn-ghost' : 'btn-primary'
  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  )
}
