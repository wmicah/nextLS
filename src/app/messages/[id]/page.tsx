import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import ConversationPage from "@/components/ConversationPage"

interface PageProps {
	params: Promise<{
		id: string
	}>
}

const Page = async ({ params }: PageProps) => {
	const { id } = await params
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user?.id) redirect("/auth-callback?origin=/messages")

	const dbUser = await db.user.findFirst({
		where: {
			id: user.id,
		},
	})

	if (!dbUser) redirect("/auth-callback?origin=/messages")

	// If user has no role set, send them to role selection
	if (!dbUser.role) {
		redirect("/role-selection")
	}

	// Verify the conversation exists and user has access
	const conversation = await db.conversation.findFirst({
		where: {
			id: id,
			OR: [{ coachId: user.id }, { clientId: user.id }],
		},
		include: {
			coach: { select: { id: true, name: true, email: true } },
			client: { select: { id: true, name: true, email: true } },
		},
	})

	if (!conversation) {
		redirect("/messages")
	}

	return <ConversationPage conversationId={id} />
}

export default Page
