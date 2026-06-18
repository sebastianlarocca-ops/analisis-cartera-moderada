import { cn } from '../../lib/utils'

export default function Input({ className, label, ...props }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-medium text-slate-700">{label}</label>}
      <input
        className={cn(
          'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition',
          className
        )}
        {...props}
      />
    </div>
  )
}
