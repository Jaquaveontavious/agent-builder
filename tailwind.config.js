/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  // Safelist dynamic classes that come from lib/templates.ts at runtime
  safelist: [
    // Category accent text colors
    'text-emerald-400', 'text-blue-400', 'text-violet-400',
    'text-rose-400', 'text-amber-400', 'text-orange-400',
    'text-teal-400', 'text-slate-300', 'text-cyan-400',
    // Category border colors
    'border-emerald-800', 'border-blue-800', 'border-violet-800',
    'border-rose-800', 'border-amber-800', 'border-orange-800',
    'border-teal-800', 'border-slate-600', 'border-cyan-800',
    // Category hover border colors
    'hover:border-emerald-600', 'hover:border-blue-600', 'hover:border-violet-600',
    'hover:border-rose-600', 'hover:border-amber-600', 'hover:border-orange-600',
    'hover:border-teal-600', 'hover:border-slate-400', 'hover:border-cyan-600',
    // Category subtle bg colors
    'bg-emerald-950/30', 'bg-blue-950/30', 'bg-violet-950/30',
    'bg-rose-950/30', 'bg-amber-950/30', 'bg-orange-950/30',
    'bg-teal-950/30', 'bg-slate-800/30', 'bg-cyan-950/30',
  ],
  plugins: [],
}
