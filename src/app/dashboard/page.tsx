import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import Dashboard from "@/components/Dashboard"

const Page = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) redirect("/auth-callback?origin=/dashboard")

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) redirect("/auth-callback?origin=/dashboard")

  // 🛡️ ADD ROLE PROTECTION HERE
  // If user is a CLIENT, redirect them to client dashboard
  if (dbUser.role === "CLIENT") {
    redirect("/client-dashboard")
  }

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection")
  }

  // Only allow COACH users to see this dashboard
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/dashboard")
  }

  return <Dashboard />
}

export default Page
