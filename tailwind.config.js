/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  future: {
    hoverOnlyWhenSupported: true
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Nunito", "ui-rounded", "Inter", "system-ui", "sans-serif"]
      },
      colors: {
        flaggo: {
          green: "#58CC02",
          greenDark: "#46A302",
          greenLight: "#89E219",
          blue: "#1CB0F6",
          blueDark: "#1899D6",
          red: "#FF4B4B",
          redDark: "#E63939",
          yellow: "#FFC800",
          orange: "#FF9600",
          purple: "#CE82FF",
          bg: "#F7FAFC",
          card: "#FFFFFF",
          text: "#1F2937",
          muted: "#6B7280",
          border: "#E5E7EB"
        }
      },
      boxShadow: {
        button: "0 6px 0 rgba(38, 50, 56, 0.16)",
        "button-green": "0 5px 0 #46A302",
        "button-blue": "0 5px 0 #1899D6",
        "button-red": "0 5px 0 #E63939",
        soft: "0 16px 40px rgba(38, 50, 56, 0.10)",
        card: "0 6px 0 #e5e7eb",
        "card-lg": "0 8px 0 #e5e7eb",
        glow: "0 12px 32px rgba(88, 204, 2, 0.35)"
      },
      backgroundImage: {
        "hero-sky": "linear-gradient(180deg, #E8F7FF 0%, #F7FAFC 70%)",
        "green-grad": "linear-gradient(180deg, #6FDB12 0%, #58CC02 100%)",
        "blue-grad": "linear-gradient(180deg, #46C3FF 0%, #1CB0F6 100%)"
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(88, 204, 2, 0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgba(88, 204, 2, 0)" }
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
