import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import ClientMessagesPage from "@/components/ClientMessagesPage"

const Page = async () => {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user || !user.id) redirect("/auth-callback?origin=/client-messages")

	const dbUser = await db.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect("/auth-callback?origin=/client-messages")

	// 🛡️ ADD ROLE PROTECTION HERE
	// If user is a COACH, redirect them to coach messages
	if (dbUser.role === "COACH") {
		redirect("/messages")
	}

	// If user has no role set, send them to role selection
	if (!dbUser.role) {
		redirect("/role-selection")
	}

	// Only allow CLIENT users to see this messages page
	if (dbUser.role !== "CLIENT") {
		redirect("/auth-callback?origin=/client-messages")
	}

	return <ClientMessagesPage />
}

export default Page
