import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        bluegray: '#334155',
        point: '#facc15',
      },
    },
  },
  plugins: [],
};
export default config;
