import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import dynamic from "next/dynamic"
import { Suspense } from "react"

// Dynamically import heavy component with no SSR to improve initial load
const ClientDetailPage = dynamic(
	() => import("@/components/ClientDetailPage"),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center min-h-screen">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
			</div>
		),
	}
)

interface PageProps {
	params: Promise<{ id: string }>
}

const Page = async ({ params }: PageProps) => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user?.id) redirect("/auth-callback?origin=/clients")

	const dbUser = await db.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect("/auth-callback?origin=/clients")

	// 🛡️ ADD ROLE PROTECTION HERE
	// If user is a CLIENT, redirect them to client dashboard
	if (dbUser.role === "CLIENT") {
		redirect("/client-dashboard")
	}

	// If user has no role set, send them to role selection
	if (!dbUser.role) {
		redirect("/role-selection")
	}

	// Only allow COACH users to see client details
	if (dbUser.role !== "COACH") {
		redirect("/auth-callback?origin=/clients")
	}

	const resolvedParams = await params

	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-screen">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
				</div>
			}
		>
			<ClientDetailPage clientId={resolvedParams.id} />
		</Suspense>
	)
}

export default Page
