import type { NextConfig } from "next"

const nextConfig: NextConfig = {
	// Production optimizations
	poweredByHeader: false,
	compress: true,

	// Security headers
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
					{
						key: "X-XSS-Protection",
						value: "1; mode=block",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=31536000; includeSubDomains",
					},
				],
			},
			{
				source: "/api/(.*)",
				headers: [
					{
						key: "Cache-Control",
						value: "no-store, max-age=0",
					},
				],
			},
		]
	},

	// Environment-specific configurations
	env: {
		CUSTOM_KEY: process.env.CUSTOM_KEY,
	},

	// Image optimization
	images: {
		domains: [
			"localhost",
			"your-production-domain.com", // Add your actual domain
		],
		formats: ["image/webp", "image/avif"],
	},

	// Experimental features for performance
	experimental: {
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},

	// Note: Webpack config removed to avoid Turbopack conflicts
	// Turbopack handles most optimizations automatically in development
	// Production builds still use webpack with Next.js defaults
}

export default nextConfig
