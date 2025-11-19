import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

export default async function ClientNotificationsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/client-notifications");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/client-notifications");

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // If user is a coach, redirect to coach notifications
  if (dbUser.role === "COACH") {
    redirect("/notifications");
  }

  return <ClientSideMobileWrapper />;
}
