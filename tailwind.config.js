/*
 * Copyright (c) 2026 PaperAxis. All rights reserved.
 * This file is part of PaperAnalysis. Unauthorized copying, modification
 * or distribution of this file is strictly prohibited.
 */

// PaperAxis kurumsal paleti (assets/tokens/tailwind.colors.js ile aynı değerler).
const pa = {
  navy: {
    950: '#05101F',
    900: '#0A1B30',
    800: '#0F2540',
    700: '#163356',
    600: '#1D4270',
    500: '#245488',
    400: '#4478AE',
    300: '#7FA3CB',
    200: '#B4CAE2',
    100: '#DAE6F2',
    50: '#EFF4FA'
  },
  coral: {
    700: '#B33C1B',
    600: '#D24C22',
    500: '#F2653A',
    400: '#F7855F',
    300: '#FAA588',
    200: '#FCC7B3',
    100: '#FDE5DA'
  },
  paper: { 300: '#D5CEC1', 200: '#E6E1D7', 100: '#F2EFE8', 50: '#FAF8F4' },
  ink: {
    900: '#14181D',
    800: '#232932',
    700: '#333B46',
    600: '#4A5462',
    500: '#667181',
    400: '#8A94A2',
    300: '#B4BCC7'
  },
  chart: {
    1: '#E0552A',
    2: '#3C7DBB',
    3: '#1E9578',
    4: '#B87D12',
    5: '#7E63C9',
    6: '#2E9BB3'
  },
  success: { DEFAULT: '#1A7A50', dark: '#4FC392' },
  warning: { DEFAULT: '#A66200', dark: '#E8B44A' },
  danger: { DEFAULT: '#C0392F', dark: '#F0736B' }
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        pa,
        // Birincil aksiyon rengi: Eksen Laciverdi. `brand-*` sınıfları arayüzde
        // yaygın kullanıldığı için korunur; değerleri markadan gelir.
        brand: {
          50: pa.navy[50],
          100: pa.navy[100],
          400: pa.navy[400],
          500: pa.navy[500],
          600: pa.navy[600],
          700: pa.navy[700]
        },
        // Vurgu: Kıvılcım Mercanı. Ekran başına tek mercan aksiyon kuralı geçerli.
        accent: pa.coral,
        panel: 'var(--panel)',
        surface: 'var(--surface)',
        edge: 'var(--edge)',
        base: 'var(--base)',
        fg: 'var(--fg)',
        muted: 'var(--muted)'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
}
