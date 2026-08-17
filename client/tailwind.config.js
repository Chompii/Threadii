/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#171412",
        paper: "#F1EAD9",
        steel: {
          DEFAULT: "#3D6A85",
          light: "#4F7F9C",
          dark: "#2C4F65",
        },
        sky: "#AFD8E3",
        cream: "#F1EAD9",
        taupe: "#8A6F52",
      },
      fontFamily: {
        display: ["'Sansita'", "serif"],
        body: ["'Quattrocento Sans'", "sans-serif"],
        caption: ["'Hind Siliguri'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
