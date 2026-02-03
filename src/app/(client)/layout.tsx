import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/client-dashboard");

  const dbUser = await db.user.findFirst({
    where: { id: user.id },
  });

  if (!dbUser) redirect("/auth-callback?origin=/client-dashboard");
  if (dbUser.role === "COACH") redirect("/dashboard");
  if (!dbUser.role) redirect("/role-selection");
  if (dbUser.role !== "CLIENT")
    redirect("/auth-callback?origin=/client-dashboard");

  return (
    <ClientSideMobileWrapper variant="client">
      {children}
    </ClientSideMobileWrapper>
  );
}
