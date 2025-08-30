import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import ClientProgramPage from "@/components/ClientProgramPage"

const Page = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) redirect("/auth-callback?origin=/client-program")

	const dbUser = await db.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect("/auth-callback?origin=/client-program")

	// 🛡️ ADD ROLE PROTECTION HERE
	// If user is a COACH, redirect them to coach dashboard
	if (dbUser.role === "COACH") {
		redirect("/dashboard")
	}

	// If user has no role set, send them to role selection
	if (!dbUser.role) {
		redirect("/role-selection")
	}

	// Only allow CLIENT users to see this program page
	if (dbUser.role !== "CLIENT") {
		redirect("/auth-callback?origin=/client-program")
	}

	return <ClientProgramPage />
}

export default Page
