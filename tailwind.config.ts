import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        success: { DEFAULT: "var(--success)", foreground: "var(--success-foreground)" },
        warning: { DEFAULT: "var(--warning)", foreground: "var(--warning-foreground)" },
        error: { DEFAULT: "var(--error)", foreground: "var(--error-foreground)" },
        info: { DEFAULT: "var(--info)", foreground: "var(--info-foreground)" },
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container-high": "var(--surface-container-high)",
        "on-surface": "var(--on-surface)",
        "on-surface-variant": "var(--on-surface-variant)",
        outline: "var(--outline)",
        "outline-variant": "var(--outline-variant)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        // Marketing-only display face (landing page h1/h2 — TASK-026/027). Not
        // used anywhere in the admin `(dashboard)` tree.
        display: ["var(--font-fraunces)", "ui-serif", "serif"],
      },
      spacing: {
        // Marketing-only section-rhythm helpers (landing page only) — additive,
        // the existing admin spacing scale is untouched.
        "section-y": "6rem",
        "section-y-sm": "3.5rem",
      },
      fontVariantNumeric: {
        tabular: "tabular-nums",
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "14px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        "2xl": "28px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "slide-in-right": "slide-in-right 200ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
