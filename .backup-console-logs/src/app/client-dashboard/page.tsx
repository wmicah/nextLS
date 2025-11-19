import { checkClientAccess } from "@/lib/clientAccessControl";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

const Page = async () => {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-dashboard");

  return <ClientSideMobileWrapper />;
};

export default Page;
