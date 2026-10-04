/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Source Sans 3", "Segoe UI", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#0c1210",
          900: "#121a17",
          800: "#1a2420",
          700: "#24322c",
        },
        brass: {
          400: "#e2c37a",
          500: "#c9a24a",
        },
        moss: {
          400: "#8fbf9a",
          500: "#4f8f6a",
        },
        rust: {
          400: "#e08a6a",
        },
      },
      boxShadow: {
        panel: "0 18px 50px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
