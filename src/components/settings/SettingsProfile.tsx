import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";

const timezones = [
  "Asia/Kolkata", "America/New_York", "America/Chicago", "America/Los_Angeles",
  "Europe/London", "Europe/Berlin", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney",
];

export default function SettingsProfile() {
  const { userProfile } = useAuth();
  const clientId = userProfile?.client_id;
  const qc = useQueryClient();

  const { data: client, isLoading } = useQuery({
    queryKey: ["settings-profile", clientId],
    enabled: !!clientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("name, business_type, contact_name, phone, email, timezone")
        .eq("id", clientId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "", business_type: "", contact_name: "", phone: "", timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    if (client) {
      setForm({
        name: client.name ?? "",
        business_type: client.business_type ?? "",
        contact_name: client.contact_name ?? "",
        phone: client.phone ?? "",
        timezone: client.timezone ?? "Asia/Kolkata",
      });
    }
  }, [client]);

  const save = useMutation({
    mutationFn: async () => {
      // Clients can't update their own row via RLS (only super_admin can)
      // So we show a message that this is view-only for now
      toast.info("Profile updates require administrator access. Contact your admin to make changes.");
    },
  });

  if (isLoading) return <Skeleton className="h-80 w-full rounded-xl" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="h-4 w-4" /> Company Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Company Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Business Type</Label>
            <Input value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Contact Person</Label>
            <Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Email</Label>
            <Input value={client?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Timezone</Label>
            <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="gap-2">
            <Save className="h-4 w-4" /> Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
