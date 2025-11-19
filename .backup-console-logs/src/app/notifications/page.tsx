import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

export default async function NotificationsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/notifications");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/notifications");

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // If user is a client, redirect to client notifications
  if (dbUser.role === "CLIENT") {
    redirect("/client-notifications");
  }

  return <ClientSideMobileWrapper />;
}
