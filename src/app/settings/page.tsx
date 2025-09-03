import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import SettingsPageClient from "@/components/SettingsPageClient"

interface SettingsPageProps {
	// Add props here if needed in the future
}

export default async function SettingsPage({}: SettingsPageProps) {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user?.id) {
		redirect("/auth-callback?origin=settings")
	}

	const dbUser = await db.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect("/auth-callback?origin=settings")

	// 🛡️ ADD ROLE PROTECTION HERE
	// If user is a CLIENT, redirect them to client dashboard
	if (dbUser.role === "CLIENT") {
		redirect("/client-dashboard")
	}

	// If user has no role set, send them to role selection
	if (!dbUser.role) {
		redirect("/role-selection")
	}

	// Only allow COACH users to see settings page
	if (dbUser.role !== "COACH") {
		redirect("/auth-callback?origin=settings")
	}

	return <SettingsPageClient />
}
