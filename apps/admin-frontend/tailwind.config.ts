import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"]
      },
      colors: {
        ink: "#07111f",
        aurora: "#50e3c2",
        ember: "#ffb86b"
      },
      boxShadow: {
        glow: "0 0 60px rgba(80, 227, 194, 0.18)"
      }
    }
  },
  plugins: []
} satisfies Config;
