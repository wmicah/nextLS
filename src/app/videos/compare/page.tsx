import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import VideoComparisonPage from "@/components/VideoComparisonPage"

export default async function Compare() {
	const { getUser } = getKindeServerSession()
	const user = await getUser()

	if (!user?.id) {
		redirect("/auth-callback?origin=videos/compare")
	}

	return <VideoComparisonPage />
}
