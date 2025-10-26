import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/analytics");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/analytics");

  // Only allow COACH users to see analytics
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/analytics");
  }

  return <>{children}</>;
}


