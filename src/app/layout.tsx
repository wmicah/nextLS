import { cn } from "@/lib/utils"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// import { Poppins } from "next/font/google"
// import Navbar from "@/components/Navbar"
import Providers from "@/components/Providers"
import ConditionalNavbar from "@/components/ConditionalNavbar"
import Toast from "@/components/common/Toast"
import MessageNotification from "@/components/MessageNotification"
import { ThemeProvider } from "@/contexts/ThemeContext"

const inter = Inter({ subsets: ["latin"] })
// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700", "800"],
//   variable: "--font-poppins",
// })

export const metadata: Metadata = {
	title: "Next Level Softball",
	description: "Professional softball coaching and training platform",
	icons: {
		icon: [
			{ url: "/favicon.ico", sizes: "any" },
			{ url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
			{ url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
		],
		apple: [
			{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
		],
		other: [
			{
				url: "/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png",
			},
			{
				url: "/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png",
			},
		],
	},
	manifest: "/site.webmanifest",
	openGraph: {
		title: "Next Level Softball",
		description: "Professional softball coaching and training platform",
		images: [
			{
				url: "/preview-image.png",
				width: 1200,
				height: 630,
				alt: "Next Level Softball Preview",
			},
		],
	},
	twitter: {
		card: "summary_large_image",
		title: "Next Level Softball",
		description: "Professional softball coaching and training platform",
		images: ["/preview-image.png"],
	},
}

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<html lang="en">
			<Providers>
				<ThemeProvider>
					<body
						className={cn(
							"min-h-screen font-sans antialiased bg-background text-foreground",
							inter.className
						)}
					>
						<ConditionalNavbar />
						{children}
						<Toast />
						<MessageNotification />
					</body>
				</ThemeProvider>
			</Providers>
		</html>
	)
}
