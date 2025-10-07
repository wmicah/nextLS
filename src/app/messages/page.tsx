import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

const Page = async () => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/messages");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/messages");

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // 🛡️ ADD ROLE PROTECTION HERE
  // If user is a CLIENT, redirect them to client messages
  if (dbUser.role === "CLIENT") {
    redirect("/client-messages");
  }

  // Only allow COACH users to access this messages page
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/messages");
  }

  return <ClientSideMobileWrapper />;
};

export default Page;
