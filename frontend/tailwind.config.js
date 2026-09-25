/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lightBg: "#F9FAFB",
        lightSurface: "#FFFFFF",
        brandAccent: "#4F46E5",
        brandHighlight: "#06B6D4",
        danger: "#EF4444",
        warning: "#F59E0B",
        success: "#10B981",
        textMain: "#111827",
        textMuted: "#6B7280"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
