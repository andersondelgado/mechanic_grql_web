/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e4',
        'primary-dark': '#028ac4',
        secondary: '#1e293b',
        accent: '#f59e0b',
        success: '#10b981',
        danger: '#ef4444',
        warning: '#f59e0b',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.08)',
        'card': '0 4px 20px rgba(0,0,0,0.04), 0 2px 8px rgba(0,0,0,0.06)',
        'strong': '0 10px 30px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
