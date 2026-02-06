import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const ClientDetailPage = dynamic(
  () => import("@/components/ClientDetailPage"),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
      </div>
    ),
  }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailRoutePage({ params }: PageProps) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) redirect("/auth-callback?origin=/clients");
  const dbUser = await db.user.findFirst({
    where: { id: user.id },
  });
  if (!dbUser) redirect("/auth-callback?origin=/clients");
  if (dbUser.role === "CLIENT") redirect("/client-dashboard");
  if (!dbUser.role) redirect("/role-selection");
  if (dbUser.role !== "COACH" && !dbUser.isAdmin)
    redirect("/auth-callback?origin=/clients");

  const resolvedParams = await params;
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300" />
        </div>
      }
    >
      <ClientDetailPage clientId={resolvedParams.id} noSidebar />
    </Suspense>
  );
}
