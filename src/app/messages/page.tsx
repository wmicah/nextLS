import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamically import heavy component for code splitting
const ClientSideMobileWrapper = dynamic(
  () => import("@/components/ClientSideMobileWrapper"),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
      </div>
    ),
  }
);

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

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
        </div>
      }
    >
      <ClientSideMobileWrapper />
    </Suspense>
  );
};

export default Page;
