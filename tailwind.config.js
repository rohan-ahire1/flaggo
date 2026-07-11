/** @type {import('tailwindcss').Config} */

// Every color resolves through a CSS variable set by the ThemeProvider, so the
// whole app re-themes live when the user switches palette. Channels are "R G B"
// triplets, which keeps Tailwind opacity utilities (e.g. bg-primary/10) working.
const v = (name) => `rgb(var(${name}) / <alpha-value>)`;

const semantic = {
  paper: v("--paper"),
  surface: v("--surface"),
  surface2: v("--surface-2"),
  line: v("--line"),
  ink: v("--ink"),
  muted: v("--muted"),
  primary: v("--primary"),
  primaryDark: v("--primary-dark"),
  accent: v("--accent"),
  accentDeep: v("--accent-deep"),
  success: v("--success"),
  error: v("--error"),
  map: v("--map")
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  future: {
    hoverOnlyWhenSupported: true
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Figtree", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fredoka", "ui-rounded", "Figtree", "system-ui", "sans-serif"]
      },
      colors: {
        ...semantic
      },
      boxShadow: {
        button: "0 6px 0 rgb(var(--primary-dark))",
        "button-error": "0 5px 0 rgb(var(--error))",
        soft: "0 16px 40px rgba(20, 30, 40, 0.16)",
        card: "0 2px 6px rgba(20, 30, 40, 0.07)",
        "card-lg": "0 8px 20px rgba(20, 30, 40, 0.12)",
        glow: "0 12px 32px rgb(var(--primary) / 0.30)"
      },
      backgroundImage: {
        "hero-sky": "linear-gradient(180deg, rgb(var(--surface)) 0%, rgb(var(--paper)) 70%)"
      },
      keyframes: {
        bounceSoft: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" }
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-6px)" },
          "75%": { transform: "translateX(6px)" }
        },
        slideUp: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" }
        },
        xpPop: {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        pulseNode: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgb(var(--primary) / 0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgb(var(--primary) / 0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "60%": { transform: "scale(1.06)" },
          "100%": { opacity: "1", transform: "scale(1)" }
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        confetti: {
          "0%": { opacity: "1", transform: "translateY(0) rotate(0deg)" },
          "100%": { opacity: "0", transform: "translateY(220px) rotate(540deg)" }
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      },
      animation: {
        "bounce-soft": "bounceSoft 260ms ease-out",
        shake: "shake 360ms ease-in-out",
        "slide-up": "slideUp 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        "xp-pop": "xpPop 320ms ease-out",
        "pulse-node": "pulseNode 1.8s infinite",
        float: "float 3.5s ease-in-out infinite",
        "pop-in": "popIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fadeIn 300ms ease-out both",
        confetti: "confetti 1.4s ease-in forwards",
        "spin-slow": "spinSlow 8s linear infinite"
      }
    }
  },
  plugins: []
};
