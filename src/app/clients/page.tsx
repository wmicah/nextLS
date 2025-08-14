import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"
import ClientsPage from "@/components/ClientsPage"

export default async function Clients() {
  const { getUser } = getKindeServerSession()
  const user = await getUser()

  if (!user || !user.id) {
    redirect("/auth-callback?origin=clients")
  }

  return <ClientsPage />
}
