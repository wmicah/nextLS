"use client"

import MaxWidthWrapper from "@/components/MaxWidthWrapper"
import Link from "next/link"
import Image from "next/image"
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs"
import {
	ArrowRight,
	Check,
	Trophy,
	Target,
	Brain,
	BarChart3,
} from "lucide-react"
import { useEffect } from "react"

export default function Home() {
	// Scroll reveal
	useEffect(() => {
		const els = document.querySelectorAll<HTMLElement>("[data-reveal]")
		els.forEach((el) => {
			el.classList.add(
				"opacity-0",
				"translate-y-4",
				"transition-all",
				"duration-700"
			)
		})
		const io = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const el = entry.target as HTMLElement
					if (entry.isIntersecting) {
						el.classList.add("opacity-100", "translate-y-0")
						el.classList.remove("opacity-0", "translate-y-4")
					} else {
						el.classList.add("opacity-0", "translate-y-4")
						el.classList.remove("opacity-100", "translate-y-0")
					}
				})
			},
			{ threshold: 0.15 }
		)
		els.forEach((el) => io.observe(el))
		return () => {
			els.forEach((el) => io.unobserve(el))
			io.disconnect()
		}
	}, [])

	return (
		<div className="relative -mt-14 min-h-[calc(100vh+3.5rem)] overflow-hidden bg-gradient-to-b from-neutral-900 via-neutral-950 to-black">
			{/* Background spotlights */}
			<div className="pointer-events-none absolute inset-0 [background:radial-gradient(1200px_600px_at_8%_-10%,rgba(56,189,248,.2),transparent_60%),radial-gradient(900px_500px_at_90%_0%,rgba(59,130,246,.18),transparent_60%)]"></div>
			{/* Subtle grid */}
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:40px_40px] opacity-30"></div>

			{/* HERO */}
			<section className="relative z-10 pt-24 sm:pt-32">
				<MaxWidthWrapper className="grid items-center gap-10 lg:grid-cols-2">
					<div data-reveal>
						<h1 className="mt-5 text-5xl font-extrabold tracking-tight text-white leading-tight md:text-6xl md:leading-snug lg:text-7xl lg:leading-snug">
							Take your pitching to the{" "}
							<span className="bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 bg-clip-text text-transparent">
								Next Level
							</span>
						</h1>
						<p className="mt-5 max-w-xl text-zinc-300 sm:text-lg">
							Personalized training plans, video feedback, and proven techniques
							to build power, accuracy, and confidence in the circle.
						</p>

						<div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
							<RegisterLink className="inline-flex items-center rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-7 py-3 text-base font-semibold text-white shadow-lg transition-all hover:from-sky-600 hover:to-blue-700 hover:shadow-xl hover:scale-[1.02]">
								Get Started
								<ArrowRight className="ml-2 h-5 w-5" />
							</RegisterLink>
							<Link
								href="/pricing"
								className="inline-flex items-center rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-base font-semibold text-white/90 backdrop-blur transition-colors hover:bg-white/10"
							>
								See Pricing
							</Link>
						</div>

						<ul className="mt-6 grid grid-cols-1 gap-3 text-sm text-zinc-300 sm:grid-cols-2">
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4 text-sky-400" /> Personalized plans
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4 text-sky-400" /> Video feedback
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4 text-sky-400" /> Progress tracking
							</li>
							<li className="flex items-center gap-2">
								<Check className="h-4 w-4 text-sky-400" /> All levels welcome
							</li>
						</ul>
					</div>

					<div className="relative" data-reveal>
						<div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-sky-500/10 via-blue-500/10 to-transparent blur-2xl"></div>

						{/* Perspective wrapper */}
						<div className="[perspective:1000px]">
							<div
								className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[.03] shadow-2xl transform-gpu will-change-transform transition-transform duration-300"
								style={{
									transformStyle: "preserve-3d",
								}}
							>
								<Image
									src="/logo image.png"
									alt="App preview"
									width={1536}
									height={1024}
									priority
									quality={100}
									className="h-full w-full object-cover transition-transform duration-300"
									style={{ transform: "translateZ(30px) scale(1.02)" }}
								/>
								<div
									className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
									style={{ transform: "translateZ(20px)" }}
								></div>
							</div>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* FEATURES */}
			<section className="relative z-10 mt-24">
				<MaxWidthWrapper>
					<div className="mx-auto max-w-2xl text-center" data-reveal>
						<h2 className="text-3xl font-bold text-white sm:text-4xl">
							Why Next Level Softball?
						</h2>
						<p className="mt-3 text-zinc-400">
							Trusted by athletes at every level to achieve their pitching
							goals.
						</p>
					</div>

					<div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
						<Feature
							icon={<Trophy className="h-6 w-6" />}
							title="20+ Years Experience"
							desc="Proven results across competitive levels."
						/>
						<Feature
							icon={<Target className="h-6 w-6" />}
							title="Personalized Training"
							desc="Custom drills and targeted plans."
						/>
						<Feature
							icon={<Brain className="h-6 w-6" />}
							title="Mental Game"
							desc="Confidence and focus under pressure."
						/>
						<Feature
							icon={<BarChart3 className="h-6 w-6" />}
							title="Track Progress"
							desc="Analytics and clear milestones."
						/>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* PROCESS */}
			<section className="relative z-10 mt-28">
				<MaxWidthWrapper>
					<div className="mx-auto max-w-2xl text-center" data-reveal>
						<h3 className="text-2xl font-semibold text-white sm:text-3xl">
							Your path to excellence
						</h3>
						<p className="mt-3 text-zinc-400">
							Follow our simple 3‑step process.
						</p>
					</div>

					<div className="mt-10 grid gap-6 md:grid-cols-3">
						<Step
							number="1"
							title="Create your profile"
							desc="Tell us your goals and current level."
						/>
						<Step
							number="2"
							title="Get your plan"
							desc="Receive a personalized training program."
						/>
						<Step
							number="3"
							title="Improve & track"
							desc="Train, submit videos, and see progress."
						/>
					</div>
				</MaxWidthWrapper>
			</section>

			{/* FINAL CTA */}
			<section className="relative z-10 mt-28 mb-24">
				<MaxWidthWrapper>
					<div
						className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-sky-600/20 via-sky-500/10 to-transparent p-8 sm:p-12"
						data-reveal
					>
						<div className="absolute -inset-24 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,.25),transparent_40%)]"></div>
						<div className="mx-auto max-w-2xl text-center">
							<h4 className="text-2xl font-semibold text-white sm:text-3xl">
								Ready to take the mound with confidence?
							</h4>
							<p className="mt-3 text-zinc-300">
								Join today and start training with a plan that fits you.
							</p>
							<RegisterLink className="mt-6 inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-zinc-100">
								Start free
								<ArrowRight className="ml-2 h-4 w-4" />
							</RegisterLink>
						</div>
					</div>
				</MaxWidthWrapper>
			</section>
		</div>
	)
}

function Feature({
	icon,
	title,
	desc,
}: {
	icon: React.ReactNode
	title: string
	desc: string
}) {
	return (
		<div
			className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[.04] p-6 transition-all hover:bg-white/[.06]"
			data-reveal
		>
			<div className="absolute -inset-1 -z-10 rounded-2xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-tr from-sky-500/20 via-blue-500/10 to-transparent"></div>
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-sky-300">
				{icon}
			</div>
			<h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
			<p className="mt-2 text-sm text-zinc-400">{desc}</p>
		</div>
	)
}

function Step({
	number,
	title,
	desc,
}: {
	number: string
	title: string
	desc: string
}) {
	return (
		<div
			className="relative rounded-2xl border border-white/10 bg-white/[.04] p-6"
			data-reveal
		>
			<div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-blue-600 font-bold text-white">
				{number}
			</div>
			<h4 className="text-base font-semibold text-white">{title}</h4>
			<p className="mt-2 text-sm text-zinc-400">{desc}</p>
		</div>
	)
}
