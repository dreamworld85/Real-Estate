import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#000000",       // black color
        forest: "#3F8F4B",    // dark green
        emerald: {
          50: "#f0fdf4",
          100: "#dcfce7",
          500: "#59AD63",
          600: "#59AD63",
          700: "#3F8F4B",
          800: "#2E6B37",
        },
        gold: "#C89B3C",      // spice gold — accent
        cream: "#FAF8F3",     // background
        sage: "#E8F0EA",      // surfaces
        charcoal: "#22302E",  // body text
        coral: "#C0533E",     // destructive
        amber: "#D98C2B",     // pending
        slate: "#6B7A78",     // secondary text
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        body: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "1.25rem",
      },
      boxShadow: {
        card: "0 2px 12px rgba(15, 61, 62, 0.08)",
        nav: "0 -2px 12px rgba(15, 61, 62, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
