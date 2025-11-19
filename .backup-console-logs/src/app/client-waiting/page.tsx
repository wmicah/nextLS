import { checkWaitingPageAccess } from "@/lib/clientAccessControl";
import ClientWaitingPage from "@/components/ClientWaitingPage";

const Page = async () => {
  // This will automatically redirect if client already has a coach
  await checkWaitingPageAccess();

  return <ClientWaitingPage />;
};

export default Page;
