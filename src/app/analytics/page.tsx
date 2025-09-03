import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import AnalyticsDashboard from "@/components/AnalyticsDashboard"

const Page = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user?.id) redirect("/auth-callback?origin=/analytics")

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) redirect("/auth-callback?origin=/analytics")

  // Only allow COACH users to see analytics
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/analytics")
  }

  return <AnalyticsDashboard />
}

export default Page
