import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import LibraryPage from "@/components/LibraryPage";

export default async function Library() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    redirect("/auth-callback?origin=library");
  }

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=library");

  // 🛡️ ADD ROLE PROTECTION HERE
  // If user is a CLIENT, redirect them to client dashboard
  if (dbUser.role === "CLIENT") {
    redirect("/client-dashboard");
  }

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // Only allow COACH users or admin users to see library page
  if (dbUser.role !== "COACH" && !dbUser.isAdmin) {
    redirect("/auth-callback?origin=library");
  }

  return <LibraryPage />;
}
