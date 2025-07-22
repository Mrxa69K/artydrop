const {nextui} = require("@nextui-org/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [nextui({
    themes: {
      light: {
        colors: {
          primary: {
            50: "#fef7ee",
            100: "#fdedd3", 
            200: "#fbd7a5",
            300: "#f8bc6d",
            400: "#f59832",
            500: "#f37f0a",
            600: "#e46500",
            700: "#bd4c02",
            800: "#973c08",
            900: "#7c330b",
            DEFAULT: "#f37f0a",
            foreground: "#ffffff",
          },
        },
      },
    },
  })],
}
