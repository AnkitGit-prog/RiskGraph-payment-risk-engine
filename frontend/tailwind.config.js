/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        // Primary brand — deep navy/slate
        brand: {
          50:  "#f0f4ff",
          100: "#e0eaff",
          200: "#c0d2ff",
          300: "#8fabff",
          400: "#5c7cff",
          500: "#3252f0",
          600: "#2640d6",
          700: "#1e32ae",
          800: "#1a2a8c",
          900: "#141f6b",
          950: "#0d1347",
        },
        // Semantic risk levels
        risk: {
          low:      "#22c55e",  // green-500
          medium:   "#f59e0b",  // amber-500
          high:     "#ef4444",  // red-500
          critical: "#7c3aed",  // violet-600
        },
        // Surface / dark mode system
        surface: {
          50:  "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          700: "#1e2433",
          800: "#161b29",
          900: "#0f1420",
          950: "#080c14",
        },
      },
      backgroundImage: {
        "grid-subtle": "radial-gradient(circle, #1e2433 1px, transparent 1px)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
