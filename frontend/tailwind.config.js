/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
      },
      // Semantic tokens — every value is a CSS variable defined in index.css for
      // both light and dark. Components use bg-surface / text-muted / border-line
      // etc. and flip automatically; no scattered dark: overrides needed.
      colors: {
        bg:          "rgb(var(--bg) / <alpha-value>)",
        surface:     "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        line:        "rgb(var(--border) / <alpha-value>)",
        content:     "rgb(var(--text) / <alpha-value>)",
        muted:       "rgb(var(--muted) / <alpha-value>)",
        faint:       "rgb(var(--faint) / <alpha-value>)",
        brand:       "rgb(var(--brand) / <alpha-value>)",
        "brand-2":   "rgb(var(--brand-2) / <alpha-value>)",
        "brand-fg":  "rgb(var(--brand-fg) / <alpha-value>)",
        ok:          "rgb(var(--ok) / <alpha-value>)",
        warn:        "rgb(var(--warn) / <alpha-value>)",
        danger:      "rgb(var(--danger) / <alpha-value>)",
      },
      boxShadow: {
        card: "0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -12px rgb(0 0 0 / 0.12)",
        glow: "0 0 0 1px rgb(var(--brand) / 0.35), 0 8px 30px -8px rgb(var(--brand) / 0.45)",
      },
      borderRadius: { xl2: "1rem" },
    },
  },
  plugins: [],
};
