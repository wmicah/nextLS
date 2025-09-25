import { redirect } from "next/navigation";
import { checkClientAccess } from "@/lib/clientAccessControl";

const Page = async () => {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-program");

  // Redirect to the new dashboard since program functionality is now integrated there
  redirect("/client-dashboard");
};

export default Page;
