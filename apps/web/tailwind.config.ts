import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0df2f2',
        'background-dark': '#0a1112',
        background: '#102222',
        surface: '#1a2e2e',
        'surface-darker': '#0a1717',
        'neutral-dark': '#162e2e',
        'text-primary': '#e2e8f0',
        'text-secondary': '#cbd5e1',
        'text-muted': '#94a3b8',
        'accent-muted': 'rgba(13, 242, 242, 0.2)',
      },
    },
  },
  plugins: [],
};
export default config;
