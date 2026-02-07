import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  X,
  Pencil,
  Mic,
  FileText,
  Activity,
  BarChart3,
  Download,
  Code,
  Calendar,
  Palette,
  Settings2,
  PhoneCall,
} from "lucide-react";

interface Props {
  clientId: string;
}

interface FeatureRow {
  id: string;
  client_id: string;
  call_recordings_access: boolean | null;
  call_transcripts: boolean | null;
  realtime_monitoring: boolean | null;
  analytics_dashboard: boolean | null;
  data_export: boolean | null;
  api_access: boolean | null;
  calendar_integration: boolean | null;
  custom_branding: boolean | null;
  max_concurrent_calls: number | null;
}

const FEATURES: {
  key: keyof FeatureRow;
  label: string;
  icon: React.ElementType;
  description: string;
}[] = [
  { key: "call_recordings_access", label: "Call Recordings Access", icon: Mic, description: "Enable access when recordings feature becomes available" },
  { key: "call_transcripts", label: "Call Transcripts", icon: FileText, description: "Enable access when transcripts feature becomes available" },
  { key: "realtime_monitoring", label: "Real-time Monitoring", icon: Activity, description: "Enable access when live monitoring feature becomes available" },
  { key: "analytics_dashboard", label: "Analytics Dashboard", icon: BarChart3, description: "Enable access when analytics feature becomes available" },
  { key: "data_export", label: "Data Export", icon: Download, description: "Enable access when export feature becomes available" },
  { key: "api_access", label: "API Access", icon: Code, description: "Enable access in future execution phase" },
  { key: "calendar_integration", label: "Calendar Integration View", icon: Calendar, description: "Enable calendar view when integrations are active" },
  { key: "custom_branding", label: "Custom Branding", icon: Palette, description: "Enable white-label dashboard in future" },
];

export default function ClientFeatureAccess({ clientId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCalls, setEditingCalls] = useState(false);
  const [callsValue, setCallsValue] = useState("");
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({});

  const { data: features, isLoading } = useQuery({
    queryKey: ["client-features", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_features")
        .select("*")
        .eq("client_id", clientId)
        .maybeSingle();
      if (error) throw error;
      return data as FeatureRow | null;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { error } = await supabase
        .from("client_features")
        .update(payload as any)
        .eq("client_id", clientId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-features", clientId] });
      toast({ title: "Features updated successfully" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openModal = () => {
    if (features) {
      const state: Record<string, boolean> = {};
      FEATURES.forEach((f) => { state[f.key] = !!(features[f.key]); });
      setToggleState(state);
    }
    setModalOpen(true);
  };

  const saveFeatures = () => {
    updateMutation.mutate(toggleState);
    setModalOpen(false);
  };

  const startEditCalls = () => {
    setCallsValue(String(features?.max_concurrent_calls ?? 5));
    setEditingCalls(true);
  };

  const saveCalls = () => {
    const val = Math.max(1, Number(callsValue) || 1);
    updateMutation.mutate({ max_concurrent_calls: val });
    setEditingCalls(false);
  };

  if (isLoading) return <Skeleton className="h-64" />;
  if (!features) return null;

  const enabled = FEATURES.filter((f) => !!(features[f.key]));
  const disabled = FEATURES.filter((f) => !(features[f.key]));

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Feature Access
          </CardTitle>
          <Button variant="outline" size="sm" onClick={openModal}>
            Manage Features
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Max Concurrent Calls */}
          <div className="flex items-center gap-3 rounded-lg border border-border p-3">
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Max Concurrent Calls:</span>
            {editingCalls ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  className="w-20 h-8"
                  value={callsValue}
                  onChange={(e) => setCallsValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveCalls()}
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={saveCalls}>
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingCalls(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{features.max_concurrent_calls ?? 5}</span>
                <Button size="sm" variant="ghost" onClick={startEditCalls}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Feature Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Enabled */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Enabled</h4>
              {enabled.length === 0 ? (
                <p className="text-sm text-muted-foreground">No features enabled</p>
              ) : (
                <div className="space-y-2">
                  {enabled.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <div className="rounded-md bg-primary/10 p-1">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <Check className="h-3.5 w-3.5 text-primary" />
                      <span className="text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Disabled */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Disabled</h4>
              {disabled.length === 0 ? (
                <p className="text-sm text-muted-foreground">All features enabled</p>
              ) : (
                <div className="space-y-2">
                  {disabled.map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <div className="rounded-md bg-muted p-1">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manage Features Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Manage Feature Access</DialogTitle>
            <DialogDescription>These are access flags for future features.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {FEATURES.map(({ key, label, description, icon: Icon }) => (
              <div key={key} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <div className="mt-0.5 rounded-md bg-muted p-1.5">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-sm font-medium">{label}</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
                <Switch
                  checked={!!toggleState[key]}
                  onCheckedChange={(c) => setToggleState((s) => ({ ...s, [key]: c }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveFeatures} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
