import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          blue:      "#1e40af",
          "blue-lt": "#3b82f6",
          navy:      "#0f172a",
          green:     "#16a34a",
          amber:     "#d97706",
          red:       "#dc2626",
          bg:        "#f8fafc",
        },
      },
    },
  },
  plugins: [],
};
export default config;
