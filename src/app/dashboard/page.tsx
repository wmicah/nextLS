import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/dashboard");

  // Optimize: Only fetch role, not entire user object
  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
    select: {
      role: true, // Only fetch what we need
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/dashboard");

  // 🛡️ ADD ROLE PROTECTION HERE
  // If user is a CLIENT, redirect them to client dashboard
  if (dbUser.role === "CLIENT") {
    redirect("/client-dashboard");
  }

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // Only allow COACH users to see this dashboard
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/dashboard");
  }

  return <ClientSideMobileWrapper />;
};

export default Page;
