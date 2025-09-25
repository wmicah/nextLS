import { checkClientAccess } from "@/lib/clientAccessControl";
import ClientTopNav from "@/components/ClientTopNav";
import ClientSettingsPage from "@/components/ClientSettingsPage";

export default async function ClientSettings() {
  // This will automatically redirect if client doesn't have a coach
  await checkClientAccess("/client-settings");

  return (
    <ClientTopNav>
      <ClientSettingsPage />
    </ClientTopNav>
  );
}
