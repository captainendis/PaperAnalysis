/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af'
        },
        panel: 'var(--panel)',
        surface: 'var(--surface)',
        edge: 'var(--edge)',
        base: 'var(--base)',
        fg: 'var(--fg)',
        muted: 'var(--muted)'
      }
    }
  },
  plugins: []
}
