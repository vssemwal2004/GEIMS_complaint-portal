/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/HOMESECTION/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        heroTexture: {
          "0%": {
            transform: "translate3d(0,0,0)",
            backgroundPosition: "0% 0%"
          },
          "100%": {
            transform: "translate3d(-1%, 1%, 0)",
            backgroundPosition: "100% 100%"
          }
        },
        heroLineInLeft: {
          "0%": { transform: "translate3d(-48px, 0, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" }
        },
        heroLineOutLeft: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(-48px, 0, 0)" }
        },
        heroLineInRight: {
          "0%": { transform: "translate3d(48px, 0, 0)" },
          "100%": { transform: "translate3d(0, 0, 0)" }
        },
        heroLineOutRight: {
          "0%": { transform: "translate3d(0, 0, 0)" },
          "100%": { transform: "translate3d(48px, 0, 0)" }
        },
        heroBgFade: {
          "0%": { opacity: "0" },
          "45%": { opacity: "0.22" },
          "100%": { opacity: "0" }
        }
      },
      animation: {
        heroTexture: "heroTexture 5s ease-in-out infinite",
        heroLineInLeft: "heroLineInLeft 850ms cubic-bezier(0.22, 1, 0.36, 1) both",
        heroLineOutLeft: "heroLineOutLeft 650ms cubic-bezier(0.64, 0, 0.78, 0) both",
        heroLineInRight: "heroLineInRight 850ms cubic-bezier(0.22, 1, 0.36, 1) both",
        heroLineOutRight: "heroLineOutRight 650ms cubic-bezier(0.64, 0, 0.78, 0) both",
        heroBgFade: "heroBgFade 650ms ease-in-out both"
      }
    }
  },
  plugins: []
};
