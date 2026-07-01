/** @type {import('tailwindcss').Config} */
const token = (v) => `rgb(var(${v}) / <alpha-value>)`;

module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        paper: token("--paper"),
        surface: token("--surface"),
        "surface-2": token("--surface-2"),
        line: token("--line"),
        ink: token("--ink"),
        muted: token("--muted"),
        primary: {
          DEFAULT: token("--primary"),
          dark: token("--primary-dark")
        },
        accent: token("--accent"),
        success: token("--success"),
        error: token("--error"),
        map: token("--map")
      },
      borderRadius: {
        card: "24px"
      }
    }
  },
  plugins: []
};
