/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./src/pages/**/*.{js,jsx}",
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
        heroBlockInDown: {
          "0%": { transform: "translate3d(0, -28px, 0)", opacity: "0" },
          "100%": { transform: "translate3d(0, 0, 0)", opacity: "1" }
        },
        heroBlockOutUp: {
          "0%": { transform: "translate3d(0, 0, 0)", opacity: "1" },
          "100%": { transform: "translate3d(0, -28px, 0)", opacity: "0" }
        },
        heroBgFade: {
          "0%": { opacity: "0" },
          "45%": { opacity: "0.22" },
          "100%": { opacity: "0" }
        }
      },
      animation: {
        heroTexture: "heroTexture 5s ease-in-out infinite",
        heroBlockInDown: "heroBlockInDown 850ms cubic-bezier(0.22, 1, 0.36, 1) both",
        heroBlockOutUp: "heroBlockOutUp 650ms cubic-bezier(0.64, 0, 0.78, 0) both",
        heroBgFade: "heroBgFade 650ms ease-in-out both"
      }
    }
  },
  plugins: []
};

module.exports = config;
