import { checkClientAccess } from "@/lib/clientAccessControl";
import ClientProgramPage from "@/components/ClientProgramPage";

const Page = async () => {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-dashboard");

  return <ClientProgramPage />;
};

export default Page;
