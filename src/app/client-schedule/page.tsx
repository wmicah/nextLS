import { checkClientAccess } from "@/lib/clientAccessControl";
import ClientSchedulePageClient from "./ClientSchedulePageClient";

const Page = async () => {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-schedule");

  return <ClientSchedulePageClient />;
};

export default Page;
