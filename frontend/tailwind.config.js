/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#050816",
          dark: "#0B1020",
          card: "#111827",
          panel: "#0F172A",
          border: "#1E293B",
          cyan: "#22D3EE",
          lightblue: "#38BDF8",
          blue: "#2563EB",
          text: "#E6F1FF",
          secondary: "#94A3B8",
          accent: "#06B6D4",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444"
        }
      },
      boxShadow: {
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.25)',
        'glow-cyan-lg': '0 0 35px rgba(34, 211, 238, 0.35)',
        'glow-blue': '0 0 20px rgba(37, 99, 235, 0.3)',
        'glow-danger': '0 0 25px rgba(239, 68, 68, 0.35)',
        'glow-warning': '0 0 25px rgba(245, 158, 11, 0.35)'
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
        'radar': 'radar 4s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
