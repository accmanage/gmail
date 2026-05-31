import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Sora", "ui-sans-serif", "system-ui"],
        body: ["Nunito Sans", "ui-sans-serif", "system-ui"]
      },
      colors: {
        night: "#09121a",
        mint: "#7fffd4",
        coral: "#ff7e67"
      },
      animation: {
        rise: "rise .55s ease both"
      },
      keyframes: {
        rise: {
          "0%": { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
} satisfies Config;
