import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#d9ebff",
          200: "#bad8ff",
          300: "#8cbcff",
          400: "#5697ff",
          500: "#2f74f0",
          600: "#2057cc",
          700: "#1f48a5",
          800: "#1f3f82",
          900: "#1f376b"
        }
      }
    }
  },
  plugins: []
};

export default config;
