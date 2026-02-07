import { useAuth } from "@/hooks/useAuth";
import ClientIntegrations from "@/components/ClientIntegrations";

export default function SettingsIntegrations() {
  const { userProfile } = useAuth();
  if (!userProfile?.client_id) return null;
  return <ClientIntegrations clientId={userProfile.client_id} />;
}
