/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        display: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink:     { DEFAULT: '#0a0e14', 2: '#11161e' },
        primary: { DEFAULT: '#0F4C81', 700: '#0a3a64', 100: '#e7eef8' },
        accent:  { DEFAULT: '#00C49F', 100: '#e0f7f1' },
        bg:      { DEFAULT: '#f5f7fb' },
        surface: { DEFAULT: '#ffffff', 2: '#fafbfd' },
        line:    { DEFAULT: '#e3e8f0', 2: '#eef1f6' },
        muted:   { DEFAULT: '#6b7588', 2: '#98a1b3' },
        danger:  '#e0526b',
        warn:    '#f0a637',
        info:    '#5a8def',
        success: '#00C49F',
      },
    },
  },
  plugins: [],
}
