import { hairlineWidth } from "nativewind/theme";

/** @type {import('tailwindcss').Config} */
export const darkMode = "class";
export const content = [
	"./app/**/*.{js,ts,tsx}",
	"./components/**/*.{js,ts,tsx}",
];
export const presets = [require("nativewind/preset")];
export const theme = {
	extend: {
		colors: {
			background: "hsl(var(--background))",
			foreground: "hsl(var(--foreground))",
			card: {
				DEFAULT: "hsl(var(--card))",
				foreground: "hsl(var(--card-foreground))",
			},
			popover: {
				DEFAULT: "hsl(var(--popover))",
				foreground: "hsl(var(--popover-foreground))",
			},
			primary: {
				DEFAULT: "hsl(var(--primary))",
				foreground: "hsl(var(--primary-foreground))",
			},
			secondary: {
				DEFAULT: "hsl(var(--secondary))",
				foreground: "hsl(var(--secondary-foreground))",
			},
			muted: {
				DEFAULT: "hsl(var(--muted))",
				foreground: "hsl(var(--muted-foreground))",
			},
			accent: {
				DEFAULT: "hsl(var(--accent))",
				foreground: "hsl(var(--accent-foreground))",
			},
			destructive: {
				DEFAULT: "hsl(var(--destructive))",
				foreground: "hsl(var(--destructive-foreground))",
			},
			success: {
				DEFAULT: "hsl(var(--success))",
				foreground: "hsl(var(--success-foreground))",
			},
			warning: {
				DEFAULT: "hsl(var(--warning))",
				foreground: "hsl(var(--warning-foreground))",
			},
			info: {
				DEFAULT: "hsl(var(--info))",
				foreground: "hsl(var(--info-foreground))",
			},
			border: "hsl(var(--border))",
			input: "hsl(var(--input))",
			ring: "hsl(var(--ring))",
			radius: "var(--radius)",
		},
		borderRadius: {
			xl: "calc(var(--radius) + 4px)",
			lg: "var(--radius)",
			md: "calc(var(--radius) - 2px)",
			sm: "calc(var(--radius) - 4px)",
			xs: "var(--radius-xs)",
		},
		boxShadow: {
			card: "0px 10px 28px rgba(0, 0, 0, 0.22)",
			focus: "0px 0px 0px 3px rgba(234, 13, 64, 0.26)",
		},
		borderWidth: {
			hairline: hairlineWidth(),
		},
	},
	fontFamily: {
		sans: ["var(--font-sans)"],
		"sans-medium": ["var(--font-sans-medium)"],
		"sans-bold": ["var(--font-sans-bold)"],
		display: ["var(--font-display)"],
	},
};
export const plugins = [];
