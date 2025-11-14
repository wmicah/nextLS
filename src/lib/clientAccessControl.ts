import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";

export interface ClientAccessControlResult {
  user: any;
  dbUser: any;
  clientRecord: any;
}

/**
 * Utility function to check client access and redirect if necessary
 * This ensures clients without coaches can only access the waiting page
 */
export async function checkClientAccess(
  origin: string
): Promise<ClientAccessControlResult> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect(`/auth-callback?origin=${origin}`);

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect(`/auth-callback?origin=${origin}`);

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // If user is a COACH, redirect them to coach dashboard
  if (dbUser.role === "COACH") {
    redirect("/dashboard");
  }

  // Only allow CLIENT users to access client pages
  if (dbUser.role !== "CLIENT") {
    redirect(`/auth-callback?origin=${origin}`);
  }

  // Check if client has been assigned to a coach
  const clientRecord = await db.client.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // If client has no coach OR is archived, redirect to waiting page
  // Archived clients should be on waiting page so they can switch coaches
  if (!clientRecord?.coachId || clientRecord.archived) {
    redirect("/client-waiting");
  }

  return { user, dbUser, clientRecord };
}

/**
 * Simplified check for waiting page access (allows clients without coaches)
 */
export async function checkWaitingPageAccess(): Promise<{
  user: any;
  dbUser: any;
  clientRecord: any;
}> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) redirect("/auth-callback?origin=/client-waiting");

  const dbUser = await db.user.findFirst({
    where: {
      id: user.id,
    },
  });

  if (!dbUser) redirect("/auth-callback?origin=/client-waiting");

  // If user is a COACH, redirect them to coach dashboard
  if (dbUser.role === "COACH") {
    redirect("/dashboard");
  }

  // If user has no role set, send them to role selection
  if (!dbUser.role) {
    redirect("/role-selection");
  }

  // Only allow CLIENT users to see this waiting page
  if (dbUser.role !== "CLIENT") {
    redirect("/auth-callback?origin=/client-waiting");
  }

  // Check if client has been assigned to a coach
  const clientRecord = await db.client.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      coach: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // If client has a coach AND is not archived, redirect to client dashboard
  // Archived clients stay on waiting page so they can switch coaches
  if (clientRecord?.coachId && !clientRecord.archived) {
    redirect("/client-dashboard");
  }

  return { user, dbUser, clientRecord };
}
