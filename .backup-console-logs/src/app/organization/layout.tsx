import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import OrganizationSidebar from "@/components/OrganizationSidebar";

export default async function OrganizationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    redirect("/auth/signin");
  }

  // Check if user is a coach
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: {
      role: true,
      organizationId: true,
    },
  });

  // Redirect if not a coach
  if (dbUser?.role !== "COACH") {
    redirect("/dashboard");
  }

  // Check if coach is in an organization
  if (!dbUser?.organizationId) {
    const coachOrganization = await db.coachOrganization.findFirst({
      where: {
        coachId: user.id,
        isActive: true,
      },
    });

    if (!coachOrganization) {
      redirect("/dashboard");
    }
  }

  return <OrganizationSidebar>{children}</OrganizationSidebar>;
}
