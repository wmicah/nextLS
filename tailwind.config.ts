import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "475px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      // iPad-specific breakpoints
      ipad: "768px",
      "ipad-lg": "1024px",
      "ipad-pro": "1366px",
    },
    extend: {
      maxWidth: {
        "8xl": "1408px",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-up": "accordion-up 0.2s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your custom moody palette
        background: {
          DEFAULT: "#2A3133", // Dark Background
          card: "#353A3A", // Card/Box Background
        },
        foreground: {
          DEFAULT: "#ABA4AA", // Light Text
          muted: "#606364", // Border/Text Accent
          accent: "#C3BCC2", // Soft Highlight
        },
        border: {
          DEFAULT: "#606364", // Border/Text Accent
          muted: "#4A4F4F", // Slightly darker for subtle borders
        },
        // Override default grays with your palette
        gray: {
          50: "#F8F7F8",
          100: "#E8E6E8",
          200: "#D4D1D4",
          300: "#C3BCC2", // Soft Highlight
          400: "#ABA4AA", // Light Text
          500: "#8A8288",
          600: "#606364", // Border/Text Accent
          700: "#4A4F4F",
          800: "#353A3A", // Card/Box Background
          900: "#2A3133", // Dark Background
          950: "#1F2324",
        },
        // Keep orange for accents
        orange: {
          500: "#F97316",
          600: "#EA580C",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
