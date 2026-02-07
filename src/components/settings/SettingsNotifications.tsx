import { useAuth } from "@/hooks/useAuth";
import ClientNotifications from "@/components/ClientNotifications";

export default function SettingsNotifications() {
  const { userProfile } = useAuth();
  if (!userProfile?.client_id) return null;
  return <ClientNotifications clientId={userProfile.client_id} />;
}
