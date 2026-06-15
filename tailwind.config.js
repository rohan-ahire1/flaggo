/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        flaggo: {
          green: "#58CC02",
          greenDark: "#46A302",
          blue: "#1CB0F6",
          red: "#FF4B4B",
          yellow: "#FFC800",
          orange: "#FF9600",
          bg: "#F7FAFC",
          card: "#FFFFFF",
          text: "#263238",
          muted: "#6B7280",
          border: "#E5E7EB"
        }
      },
      boxShadow: {
        button: "0 6px 0 rgba(38, 50, 56, 0.16)",
        soft: "0 16px 40px rgba(38, 50, 56, 0.10)"
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
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(88, 204, 2, 0.35)" },
          "50%": { boxShadow: "0 0 0 12px rgba(88, 204, 2, 0)" }
        }
      },
      animation: {
        "bounce-soft": "bounceSoft 260ms ease-out",
        shake: "shake 260ms ease-in-out",
        "slide-up": "slideUp 220ms ease-out",
        "xp-pop": "xpPop 220ms ease-out",
        "pulse-node": "pulseNode 1.4s infinite"
      }
    }
  },
  plugins: []
};
