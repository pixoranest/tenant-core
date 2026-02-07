import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Mic,
  FileText,
  Activity,
  BarChart3,
  Download,
  Code,
  Calendar,
  Palette,
} from "lucide-react";
import { ClientFormData } from "@/types/client";
import WizardField from "./WizardField";

interface Props {
  form: ClientFormData;
  set: (field: keyof ClientFormData, value: string | boolean | number) => void;
  errors: Partial<Record<keyof ClientFormData, string>>;
}

const FEATURE_FLAGS: {
  key: keyof ClientFormData;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  { key: "feature_call_recordings", label: "Call Recordings Access", description: "Enable access when recordings feature becomes available", icon: Mic },
  { key: "feature_call_transcripts", label: "Call Transcripts", description: "Enable access when transcripts feature becomes available", icon: FileText },
  { key: "feature_realtime_monitoring", label: "Real-time Monitoring", description: "Enable access when live monitoring feature becomes available", icon: Activity },
  { key: "feature_analytics_dashboard", label: "Analytics Dashboard", description: "Enable access when analytics feature becomes available", icon: BarChart3 },
  { key: "feature_data_export", label: "Data Export", description: "Enable access when export feature becomes available", icon: Download },
  { key: "feature_api_access", label: "API Access", description: "Enable access in future execution phase", icon: Code },
  { key: "feature_calendar_integration", label: "Calendar Integration View", description: "Enable calendar view when integrations are active", icon: Calendar },
  { key: "feature_custom_branding", label: "Custom Branding", description: "Enable white-label dashboard in future", icon: Palette },
];

export default function StepAgentFeatures({ form, set, errors }: Props) {
  const { data: agents = [] } = useQuery({
    queryKey: ["voice-agents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_agents")
        .select("id, name, is_active")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="grid gap-6">
      {/* Section A: Agent Assignment */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Assign Voice Agent</h3>
        <div className="grid gap-4">
          <WizardField label="Voice Agent" error={errors.agent_id}>
            <Select value={form.agent_id} onValueChange={(v) => set("agent_id", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an agent (optional)" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </WizardField>
          {form.agent_id && (
            <WizardField label="Phone Number" error={errors.agent_phone}>
              <Input
                placeholder="+1 (555) 000-0000"
                value={form.agent_phone}
                onChange={(e) => set("agent_phone", e.target.value)}
              />
            </WizardField>
          )}
          <WizardField label="Max Concurrent Calls">
            <Input
              type="number"
              min={1}
              max={100}
              value={form.max_concurrent_calls}
              onChange={(e) => set("max_concurrent_calls", Number(e.target.value) || 1)}
            />
          </WizardField>
        </div>
      </div>

      <Separator />

      {/* Section B: Feature Flags */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Feature Access Control</h3>
        <div className="grid gap-3">
          {FEATURE_FLAGS.map(({ key, label, description, icon: Icon }) => (
            <div key={key} className="flex items-start gap-3 rounded-lg border border-border p-3">
              <div className="mt-0.5 rounded-md bg-muted p-1.5">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{label}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
              <Switch
                checked={form[key] as boolean}
                onCheckedChange={(c) => set(key, c)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
