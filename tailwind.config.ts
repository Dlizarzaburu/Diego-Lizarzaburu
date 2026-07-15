import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core surfaces — black, charcoal, deep navy
        ink: {
          950: "#050509",
          900: "#0a0a12",
          800: "#12121d",
          700: "#1b1b2b",
          600: "#252539",
        },
        navy: {
          900: "#070b1c",
          800: "#0c1330",
          700: "#131d47",
        },
        // Accents — electric purple, neon blue, magenta, warm red
        violetx: { DEFAULT: "#8b5cf6", bright: "#a78bfa", deep: "#6d28d9" },
        neon: { DEFAULT: "#3b82f6", bright: "#60a5fa", cyan: "#22d3ee" },
        magenta: { DEFAULT: "#ec4899", bright: "#f472b6" },
        ember: { DEFAULT: "#f43f5e", warm: "#fb7185" },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-glow":
          "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.18), transparent 45%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.16), transparent 45%), radial-gradient(circle at 50% 100%, rgba(236,72,153,0.14), transparent 50%)",
        "accent-gradient":
          "linear-gradient(120deg, #8b5cf6 0%, #3b82f6 45%, #ec4899 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -8px rgba(139,92,246,0.45)",
        "glow-blue": "0 0 40px -8px rgba(59,130,246,0.45)",
        "glow-magenta": "0 0 40px -8px rgba(236,72,153,0.4)",
        card: "0 20px 60px -20px rgba(0,0,0,0.7)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-glow": {
          "0%,100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "spin-slow": "spin-slow 22s linear infinite",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
