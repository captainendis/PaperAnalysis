/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'accent' | 'ghost' | 'danger' | 'subtle'

// PaperAxis kuralı: birincil aksiyon lacivert; mercan yalnızca vurgu içindir ve
// ekran başına tek bir mercan aksiyon bulunur. Mercan üstüne beyaz yazı gelmez —
// yazı rengi ink-900'dür (kontrast 5.69).
const styles: Record<Variant, string> = {
  primary: 'bg-brand-500 hover:bg-brand-600 text-white',
  accent: 'bg-accent-500 hover:bg-accent-400 text-pa-ink-900',
  ghost: 'bg-transparent hover:bg-white/10 text-gray-200 border border-edge',
  danger: 'bg-pa-danger hover:opacity-90 text-white',
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
