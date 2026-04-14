/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
		extend: {
			colors: {
				surface: {
					base: "#0f1623",
					raised: "#131c2e",
					card: "#1a2235",
					border: "rgba(99,130,255,0.10)",
				},
				brand: {
					DEFAULT: "#4f46e5",
					light: "#6366f1",
					muted: "#818cf8",
					subtle: "rgba(99,130,255,0.10)",
				},
				text: {
					primary: "#e2e8f7",
					secondary: "#94a3b8",
					muted: "#7c8ba7",
					faint: "#5a6f8a",
				},
				success: "#34d399",
				danger: "#f87171",
			},
			fontFamily: {
				sans: ["Geist", "Inter", "system-ui", "sans-serif"],
			},
			borderRadius: {
				DEFAULT: "8px",
				lg: "10px",
				xl: "12px",
			},
		},
	},
	plugins: [],
};
