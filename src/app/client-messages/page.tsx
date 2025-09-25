import { checkClientAccess } from "@/lib/clientAccessControl";
import ClientMessagesPage from "@/components/ClientMessagesPage";

const Page = async () => {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-messages");

  return <ClientMessagesPage />;
};

export default Page;
