import { cn } from '../../lib/utils'

const variants = {
  default: 'bg-slate-100 text-slate-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
}

export default function Badge({ variant = 'default', className, children }) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
