import type { ReactNode } from 'react'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
      {children}
    </label>
  )
}

const inputCls =
  'rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-gray-100 outline-none focus:border-brand-500'

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputCls} ${props.className ?? ''}`} />
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputCls} ${props.className ?? ''}`} />
}
