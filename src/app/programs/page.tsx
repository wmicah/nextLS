import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import { db } from "@/db"
import ProgramsPage from "@/components/ProgramsPage"

const Page = async () => {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) redirect("/auth-callback?origin=/programs")

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  })

  if (!dbUser) redirect("/auth-callback?origin=/programs")

  // Only allow COACH users to see programs
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/dashboard")
  }

  return <ProgramsPage />
}

export default Page



