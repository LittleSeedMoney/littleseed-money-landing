import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        seed: {
          50: "#f6f8f1",
          100: "#e9eee0",
          200: "#d3ddc3",
          300: "#b2c598",
          400: "#8ba86b",
          500: "#67894a",
          600: "#4f6d38",
          700: "#3f562f",
          800: "#344629",
          900: "#2c3b25",
          950: "#162013"
        },
        earth: {
          50: "#fdfaf4",
          100: "#f8f0df",
          200: "#efddb9",
          300: "#e3c486",
          400: "#d4a455",
          500: "#c48a39",
          600: "#a96b2f",
          700: "#874f29",
          800: "#704128",
          900: "#603824"
        }
      },
      boxShadow: {
        soft: "0 24px 70px rgba(44, 59, 37, 0.10)"
      }
    },
  },
  plugins: [],
};

export default config;
