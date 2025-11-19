import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { validateAdminAccess } from "@/lib/admin-security";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    // Server-side admin validation
    await validateAdminAccess();

    return <>{children}</>;
  } catch (error) {
    // Redirect to dashboard if not admin
    redirect("/dashboard");
  }
}
