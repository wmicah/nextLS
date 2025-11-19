import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import ClientDetailPage from "@/components/ClientDetailPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/organization/clients");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/organization/clients");

  // Only allow COACH users to see client details
  if (dbUser.role !== "COACH") {
    redirect("/auth-callback?origin=/organization/clients");
  }

  // Verify the coach is in an organization
  const coachOrganization = await db.coachOrganization.findFirst({
    where: {
      coachId: user.id,
      isActive: true,
    },
  });

  if (!coachOrganization) {
    // If not in an organization, redirect to main clients page
    redirect("/clients");
  }

  const resolvedParams = await params;

  return (
    <ClientDetailPage
      clientId={resolvedParams.id}
      backPath="/organization/clients"
      noSidebar={true}
    />
  );
};

export default Page;
