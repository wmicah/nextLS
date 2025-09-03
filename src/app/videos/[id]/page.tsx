import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import VideoReviewPage from "@/components/VideoReviewPage"

export default async function VideoReview({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { getUser } = getKindeServerSession()
	const user = await getUser()
	const { id } = await params

	if (!user?.id) {
		redirect("/auth-callback?origin=videos")
	}

	return <VideoReviewPage videoId={id} />
}
