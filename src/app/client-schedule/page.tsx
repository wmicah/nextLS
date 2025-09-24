import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSchedulePageClient from "./ClientSchedulePageClient";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/client-schedule");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/client-schedule");

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // Only allow CLIENT users to see this schedule page
  if (dbUser.role !== "CLIENT") {
    redirect("/auth-callback?origin=/client-schedule");
  }

  return <ClientSchedulePageClient />;
};

export default Page;
