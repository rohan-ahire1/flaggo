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
        display: ["Fredoka", "ui-rounded", "Figtree", "system-ui", "sans-serif"],
        // Kids Mode has its own playful type: Baloo 2 for headers, Nunito for text.
        baloo: ["'Baloo 2'", "Fredoka", "ui-rounded", "system-ui", "sans-serif"],
        nunito: ["Nunito", "Figtree", "system-ui", "sans-serif"]
      },
      colors: {
        ...semantic,
        // Kids Mode fixed palette (does not re-theme with the adult app).
        kid: {
          blue: "#2CA8E0",
          "blue-dark": "#1F89BA",
          coral: "#FF8A5B",
          "coral-dark": "#E0703F",
          gold: "#FFC93C",
          "gold-dark": "#E0A91F",
          green: "#2EC16B",
          "green-dark": "#23A457",
          purple: "#7C6CF0",
          "purple-dark": "#5F50CF",
          ink: "#2B3A55",
          slate: "#8497B3",
          surface: "#EEF6FB"
        },
        region: {
          americas: "#57C04A",
          europe: "#FF6B6B",
          africa: "#F4B400",
          asia: "#F978A6",
          oceania: "#FF9A3D"
        }
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
        },
        kidBob: {
          "0%, 100%": { transform: "translateY(0) rotate(-2deg)" },
          "50%": { transform: "translateY(-6px) rotate(2deg)" }
        },
        kidGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(255,201,60,0.55)" },
          "50%": { boxShadow: "0 0 0 14px rgba(255,201,60,0)" }
        },
        kidWiggle: {
          "0%, 100%": { transform: "rotate(0)" },
          "20%": { transform: "rotate(-6deg)" },
          "40%": { transform: "rotate(5deg)" },
          "60%": { transform: "rotate(-4deg)" },
          "80%": { transform: "rotate(3deg)" }
        },
        kidPulse: {
          "0%, 100%": { transform: "scale(1)", boxShadow: "0 4px 0 rgba(0,0,0,0.14), 0 0 0 0 rgba(255,255,255,0.6)" },
          "50%": { transform: "scale(1.04)", boxShadow: "0 4px 0 rgba(0,0,0,0.14), 0 0 0 12px rgba(255,255,255,0)" }
        },
        kidFall: {
          "0%": { transform: "translateY(-30px) rotate(0)", opacity: "1" },
          "100%": { transform: "translateY(110vh) rotate(540deg)", opacity: "1" }
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
        "spin-slow": "spinSlow 8s linear infinite",
        "kid-bob": "kidBob 3s ease-in-out infinite",
        "kid-glow": "kidGlow 2.2s ease-in-out infinite",
        "kid-wiggle": "kidWiggle 500ms ease-in-out",
        "kid-pulse": "kidPulse 1.8s ease-in-out infinite",
        "kid-fall": "kidFall 2.6s linear infinite"
      }
    }
  },
  plugins: []
};
