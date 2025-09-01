"use client"

import { useState } from "react"
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import { ArrowRight, Mail, Lock, Eye, EyeOff, Target } from "lucide-react"
import Link from "next/link"

export default function SignInPage() {
	const [email, setEmail] = useState("")
	const [password, setPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [isLoading] = useState(false)

	return (
		<div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<Card className="bg-white/5 border-white/10 backdrop-blur-xl">
					<CardHeader className="text-center">
						<div className="mx-auto w-12 h-12 bg-gradient-to-r from-sky-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
							<Target className="h-6 w-6 text-white" />
						</div>
						<CardTitle className="text-2xl font-bold text-white">
							Welcome back
						</CardTitle>
						<CardDescription className="text-zinc-400">
							Sign in to your Next Level Softball account
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email" className="text-white">
									Email
								</Label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
									<Input
										id="email"
										type="email"
										placeholder="Enter your email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-400"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password" className="text-white">
									Password
								</Label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
									<Input
										id="password"
										type={showPassword ? "text" : "password"}
										placeholder="Enter your password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-400"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<LoginLink className="w-full">
								<Button
									className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
									disabled={isLoading}
								>
									{isLoading ? "Signing in..." : "Sign In"}
									<ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							</LoginLink>
						</div>

						<div className="mt-6 text-center">
							<p className="text-zinc-400 text-sm">
								Don&apos;t have an account?{" "}
								<Link
									href="/auth/signup"
									className="text-sky-400 hover:text-sky-300 font-medium"
								>
									Sign up
								</Link>
							</p>
						</div>

						<div className="mt-6">
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<span className="w-full border-t border-white/10" />
								</div>
								<div className="relative flex justify-center text-xs uppercase">
									<span className="bg-black px-2 text-zinc-400">
										Or continue with
									</span>
								</div>
							</div>

							<div className="mt-6 grid grid-cols-1 gap-3">
								<LoginLink className="w-full">
									<Button
										variant="outline"
										className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10"
									>
										<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
											<path
												fill="currentColor"
												d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											/>
											<path
												fill="currentColor"
												d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											/>
											<path
												fill="currentColor"
												d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
											/>
											<path
												fill="currentColor"
												d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
											/>
										</svg>
										Continue with Google
									</Button>
								</LoginLink>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
