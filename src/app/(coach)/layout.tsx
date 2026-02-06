import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/dashboard");

  const dbUser = await db.user.findFirst({
    where: { id: user.id },
  });

  if (!dbUser) redirect("/auth-callback?origin=/dashboard");
  if (dbUser.role === "CLIENT") redirect("/client-dashboard");
  if (!dbUser.role) redirect("/role-selection");
  if (dbUser.role !== "COACH" && !dbUser.isAdmin)
    redirect("/auth-callback?origin=/dashboard");

  return (
    <ClientSideMobileWrapper variant="coach">
      {children}
    </ClientSideMobileWrapper>
  );
}
