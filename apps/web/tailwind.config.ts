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
        primary: '#1d7874',
        'background-dark': '#f4f1de',
        background: '#fcfaf3',
        surface: '#ffffff',
        'surface-darker': '#e8f0ed',
        'neutral-dark': '#d7e5df',
        'card-soft': '#f8fbfa',
        'card-strong': '#e6eeeb',
        'border-subtle': '#cad7d3',
        'text-strong': '#071e22',
        'text-primary': '#16323f',
        'text-secondary': '#355763',
        'text-muted': '#61767e',
        danger: '#bb3e54',
        'danger-soft': '#f6dde2',
        'accent-muted': '#d2ebe6',
      },
    },
  },
  plugins: [],
};
export default config;
