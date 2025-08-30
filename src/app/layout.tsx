import { cn } from "@/lib/utils"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
// import { Poppins } from "next/font/google"
// import Navbar from "@/components/Navbar"
import Providers from "@/components/Providers"
import ConditionalNavbar from "@/components/ConditionalNavbar"
import Toast from "@/components/common/Toast"
import { ThemeProvider } from "@/contexts/ThemeContext"

const inter = Inter({ subsets: ["latin"] })
// const poppins = Poppins({
//   subsets: ["latin"],
//   weight: ["300", "400", "500", "600", "700", "800"],
//   variable: "--font-poppins",
// })

export const metadata: Metadata = {
	title: "Next Level Softball",
	description: "Next Level Softball",
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
					</body>
				</ThemeProvider>
			</Providers>
		</html>
	)
}
