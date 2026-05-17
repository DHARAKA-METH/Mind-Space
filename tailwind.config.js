/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./App.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#C8E86A",
        lavender: "#E8D5F5",
        peach: "#FFD4B8",
        skyBlue: "#C2E0FF",
        softRed: "#FFCDD2",
        yellow: "#FFF0B3",
        dark: "#222222",
        background: "#F9FAF5",
      },
    },
  },
  plugins: [],
};
