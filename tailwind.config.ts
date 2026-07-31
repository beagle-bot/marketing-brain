import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#141413",
        paper: "#faf9f5",
        card: "#ffffff",
        line: "#e8e5dd",
        muted: "#6e6a60",
        faint: "#a39e93",
        clay: "#c15f3c"
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "Songti SC", "STSong", "Noto Serif SC", "serif"],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif"
        ]
      },
      borderRadius: {
        card: "6px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 20, 19, 0.04), 0 3px 10px rgba(20, 20, 19, 0.04)",
        sheet: "0 -8px 32px rgba(20, 20, 19, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
