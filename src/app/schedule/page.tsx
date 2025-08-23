import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import SchedulePageClient from "./SchedulePageClient"

const Page = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) redirect("/auth-callback?origin=/schedule")

	const dbUser = await db.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect("/auth-callback?origin=/schedule")

	// If user has no role set, send them to role selection
	if (!dbUser.role) {
		redirect("/role-selection")
	}

	// Only allow COACH users to see this schedule page
	if (dbUser.role !== "COACH") {
		redirect("/auth-callback?origin=/schedule")
	}

	return <SchedulePageClient />
}

export default Page
