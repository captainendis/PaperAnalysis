import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'subtle'

const styles: Record<Variant, string> = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-200 border border-edge',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  subtle: 'bg-white/5 hover:bg-white/10 text-gray-200'
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'subtle', className = '', children, ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
