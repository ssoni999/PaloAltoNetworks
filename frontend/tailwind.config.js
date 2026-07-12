/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        health: {
          50: "#f0fdf9",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
        },
        calm: {
          blue: "#dbeafe",
          purple: "#ede9fe",
          green: "#d1fae5",
        },
      },
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 4px 24px rgba(15, 23, 42, 0.06)",
        card: "0 8px 32px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};
