import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "var(--font-rubik)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9",
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
        },
        success: {
          50:  "#ECFDF5",
          100: "#D1FAE5",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        card:         "0 1px 3px rgba(2,132,199,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-md":    "0 4px 16px rgba(2,132,199,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        "card-lg":    "0 8px 32px rgba(2,132,199,0.10), 0 2px 8px rgba(0,0,0,0.04)",
        float:        "0 -2px 20px rgba(0,0,0,0.06)",
        "brand-glow": "0 4px 24px rgba(2,132,199,0.30)",
        "green-glow": "0 4px 24px rgba(5,150,105,0.30)",
      },
      animation: {
        "fade-in":  "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.28s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scaleIn 0.2s ease-out",
        "shimmer":  "shimmer 1.5s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
