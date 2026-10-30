/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', '"Noto Sans KR"', '"Malgun Gothic"', 'system-ui', 'sans-serif'],
      },
      colors: {
        canvas: '#f8fafc',
        frame: '#e2e8f0',
        navy: '#0f172a',
        accent: '#2563eb',
        inspect: { DEFAULT: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        caution: { DEFAULT: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        normal: { DEFAULT: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
      },
    },
  },
  plugins: [],
};
