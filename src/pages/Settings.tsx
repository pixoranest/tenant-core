import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Shield, Bell, Puzzle, SlidersHorizontal } from "lucide-react";
import SettingsProfile from "@/components/settings/SettingsProfile";
import SettingsSecurity from "@/components/settings/SettingsSecurity";
import SettingsNotifications from "@/components/settings/SettingsNotifications";
import SettingsIntegrations from "@/components/settings/SettingsIntegrations";
import SettingsPreferences from "@/components/settings/SettingsPreferences";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Puzzle },
  { id: "preferences", label: "Preferences", icon: SlidersHorizontal },
] as const;

type TabId = typeof tabs[number]["id"];

export default function Settings() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <nav className="flex flex-row gap-1 lg:w-56 lg:flex-col lg:shrink-0">
          {tabs.map((t) => (
            <Button
              key={t.id}
              variant={tab === t.id ? "secondary" : "ghost"}
              size="sm"
              className={`justify-start gap-2 ${tab === t.id ? "font-medium" : "text-muted-foreground"}`}
              onClick={() => setTab(t.id)}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </Button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === "profile" && <SettingsProfile />}
          {tab === "security" && <SettingsSecurity />}
          {tab === "notifications" && <SettingsNotifications />}
          {tab === "integrations" && <SettingsIntegrations />}
          {tab === "preferences" && <SettingsPreferences />}
        </div>
      </div>
    </div>
  );
}
