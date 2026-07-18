import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F3D3E",       // deep backwater teal — primary
        forest: "#1B5E4F",    // secondary green
        gold: "#C89B3C",      // spice gold — accent
        cream: "#FAF8F3",     // background
        sage: "#E8F0EA",      // surfaces
        charcoal: "#22302E",  // body text
        coral: "#C0533E",     // destructive
        amber: "#D98C2B",     // pending
        slate: "#6B7A78",     // secondary text
      },
      fontFamily: {
        display: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
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
