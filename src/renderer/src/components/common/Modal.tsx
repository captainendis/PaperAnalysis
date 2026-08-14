/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** İçeriği geniş tut (editör gibi). */
  wide?: boolean
  footer?: ReactNode
}

export function Modal({ open, title, onClose, children, wide, footer }: Props) {
  if (!open || typeof document === 'undefined') return null

  // Modalı doğrudan <body>'ye taşı (portal). Böylece iç içe modallar (ör. Grafik
  // Düzenleyici içinden açılan Birleştir sihirbazı) üst modalın DOM alt ağacına
  // sıkışmaz; yerleşim/odak/tıklama sorunları (değer kutusuna yazamama vb.) çözülür.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onMouseDown={onClose}
    >
      <div
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-xl border border-edge bg-panel shadow-2xl ${
          wide ? 'max-w-7xl' : 'max-w-lg'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-edge px-5 py-3">
          <h2 className="text-base font-semibold text-gray-100">{title}</h2>
          <button
            className="rounded p-1 text-gray-400 hover:bg-white/10 hover:text-gray-200"
            onClick={onClose}
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-edge px-5 py-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  )
}
