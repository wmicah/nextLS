import { checkClientAccess } from "@/lib/clientAccessControl";
import ClientSideMobileWrapper from "@/components/ClientSideMobileWrapper";

export default async function ClientSettings() {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-settings");

  return <ClientSideMobileWrapper />;
}
