import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, AlertTriangle, Settings, Table2, Calendar, Globe, Webhook } from "lucide-react";
import { format } from "date-fns";
import type { Json } from "@/integrations/supabase/types";

interface Props {
  clientId: string;
}

interface IntegrationRow {
  id: string;
  client_id: string;
  integration_type: string;
  config: Json;
  status: string | null;
  last_sync: string | null;
  updated_at: string | null;
}

const INTEGRATION_DEFS: {
  type: string;
  label: string;
  icon: React.ElementType;
  configKey: string;
  inputLabel: string;
  placeholder: string;
  isPassword?: boolean;
}[] = [
  { type: "google_sheets", label: "Google Sheets", icon: Table2, configKey: "sheet_url", inputLabel: "Sheet URL", placeholder: "https://docs.google.com/spreadsheets/d/..." },
  { type: "google_calendar", label: "Google Calendar", icon: Calendar, configKey: "calendar_id", inputLabel: "Calendar ID", placeholder: "your-calendar@gmail.com" },
  { type: "cal_com", label: "Cal.com", icon: Globe, configKey: "api_key", inputLabel: "API Key", placeholder: "cal_live_...", isPassword: true },
  { type: "custom_webhook", label: "Custom Webhook", icon: Webhook, configKey: "webhook_url", inputLabel: "Webhook URL", placeholder: "https://your-endpoint.com/webhook" },
];

function getStatusBadge(status: string | null | undefined) {
  if (status === "configured") return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Configured</Badge>;
  if (status === "error") return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">Error</Badge>;
  return <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Not Configured</Badge>;
}

export default function ClientIntegrations({ clientId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [configModal, setConfigModal] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [tested, setTested] = useState(false);

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["client-integrations", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_integrations")
        .select("*")
        .eq("client_id", clientId);
      if (error) throw error;
      return data as IntegrationRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, config }: { type: string; config: Record<string, string> }) => {
      const existing = integrations.find((i) => i.integration_type === type);
      if (existing) {
        const { error } = await supabase
          .from("client_integrations")
          .update({ config: config as any, status: "configured" } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("client_integrations")
          .insert({ client_id: clientId, integration_type: type, config: config as any, status: "configured" } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-integrations", clientId] });
      toast({ title: "Integration saved" });
      setConfigModal(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: async (type: string) => {
      const existing = integrations.find((i) => i.integration_type === type);
      if (!existing) return;
      const { error } = await supabase
        .from("client_integrations")
        .update({ status: "inactive" } as any)
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-integrations", clientId] });
      toast({ title: "Integration disconnected" });
      setConfigModal(null);
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openConfig = (type: string) => {
    const def = INTEGRATION_DEFS.find((d) => d.type === type)!;
    const existing = integrations.find((i) => i.integration_type === type);
    const config = existing?.config as Record<string, string> | null;
    setInputValue(config?.[def.configKey] ?? "");
    setTested(false);
    setConfigModal(type);
  };

  const activeDef = configModal ? INTEGRATION_DEFS.find((d) => d.type === configModal) : null;
  const activeRow = configModal ? integrations.find((i) => i.integration_type === configModal) : null;

  if (isLoading) return <Skeleton className="h-48 lg:col-span-2" />;

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" /> Integrations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATION_DEFS.map((def) => {
              const row = integrations.find((i) => i.integration_type === def.type);
              const status = row?.status === "inactive" ? null : row?.status;
              return (
                <div key={def.type} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-muted p-2">
                      <def.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{def.label}</p>
                      {row?.updated_at && status === "configured" && (
                        <p className="text-xs text-muted-foreground">Updated {format(new Date(row.updated_at), "MMM d, yyyy")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(status)}
                    <Button variant="outline" size="sm" onClick={() => openConfig(def.type)}>Configure</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Configure Modal */}
      {activeDef && (
        <Dialog open={!!configModal} onOpenChange={(o) => { if (!o) setConfigModal(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Configure {activeDef.label}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid gap-1.5">
                <Label className="text-sm">{activeDef.inputLabel}</Label>
                <Input
                  type={activeDef.isPassword ? "password" : "text"}
                  placeholder={activeDef.placeholder}
                  value={inputValue}
                  onChange={(e) => { setInputValue(e.target.value); setTested(false); }}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setTested(true); toast({ title: "Connection test passed (mock)" }); }}
                  disabled={!inputValue.trim()}
                >
                  {tested ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-primary" /> Passed</> : "Test Connection"}
                </Button>
                {activeRow && activeRow.status === "configured" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => disconnectMutation.mutate(configModal!)}
                    disabled={disconnectMutation.isPending}
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigModal(null)}>Cancel</Button>
              <Button
                onClick={() => saveMutation.mutate({ type: configModal!, config: { [activeDef.configKey]: inputValue } })}
                disabled={!inputValue.trim() || saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
