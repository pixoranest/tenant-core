import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Pencil,
  Building2,
  Mail,
  Phone,
  Globe,
  Calendar,
  CreditCard,
  PhoneCall,
  Clock,
  DollarSign,
  Bot,
  Activity,
  User,
} from "lucide-react";
import { format } from "date-fns";
import ClientFormModal from "@/components/ClientFormModal";
import { ClientRecord, STATUS_COLOR, PLAN_LABEL } from "@/types/client";

export default function AdminClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);

  const { data: client, isLoading, error } = useQuery({
    queryKey: ["admin-client-detail", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId!)
        .maybeSingle();
      if (error) throw error;
      return data as ClientRecord | null;
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold text-foreground">Client Not Found</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The client you're looking for doesn't exist.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/clients")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-foreground">{client.name}</h1>
              <Badge variant="outline" className={STATUS_COLOR[client.status] ?? ""}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
            </div>
            {client.contact_name && (
              <p className="text-sm text-muted-foreground">{client.contact_name}</p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="mr-2 h-4 w-4" /> Edit Client
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Section 1: Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoRow icon={Building2} label="Company Name" value={client.name} />
            <InfoRow icon={User} label="Contact Person" value={client.contact_name ?? "—"} />
            <InfoRow icon={Mail} label="Email" value={client.email} />
            <InfoRow icon={Phone} label="Phone" value={client.phone ?? "—"} />
            <InfoRow icon={Building2} label="Business Type" value={client.business_type ?? "—"} />
            <InfoRow icon={Globe} label="Time Zone" value={client.timezone ?? "—"} />
            <InfoRow
              icon={Calendar}
              label="Created"
              value={format(new Date(client.created_at), "MMM d, yyyy")}
            />
            {client.updated_at && (
              <InfoRow
                icon={Calendar}
                label="Last Updated"
                value={format(new Date(client.updated_at), "MMM d, yyyy 'at' h:mm a")}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 2: Billing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Billing Information</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <InfoRow
              icon={CreditCard}
              label="Billing Plan"
              value={PLAN_LABEL[client.billing_plan ?? ""] ?? client.billing_plan ?? "—"}
            />
            <InfoRow
              icon={DollarSign}
              label="Rate per Minute"
              value={client.rate_per_minute != null ? `₹${client.rate_per_minute}` : "—"}
            />
            <InfoRow
              icon={Clock}
              label="Monthly Allowance"
              value={client.monthly_allowance != null ? `${client.monthly_allowance} min` : "—"}
            />
            <InfoRow
              icon={DollarSign}
              label="Overage Rate"
              value={client.overage_rate != null ? `₹${client.overage_rate}` : "—"}
            />
            {client.trial_end_date && (
              <InfoRow
                icon={Calendar}
                label="Trial End Date"
                value={format(new Date(client.trial_end_date), "MMM d, yyyy")}
              />
            )}
          </CardContent>
        </Card>

        {/* Section 3: Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard icon={PhoneCall} label="Total Calls This Month" value="142" />
              <StatCard icon={Clock} label="Minutes Used This Month" value="1,245" />
              <StatCard icon={DollarSign} label="Estimated Monthly Cost" value="₹3,112" />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Voice Agents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assigned Voice Agents</CardTitle>
            <Button variant="outline" size="sm" disabled>
              <Bot className="mr-1 h-3.5 w-3.5" /> Assign Agent
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No agents assigned yet</p>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No recent activity available</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <ClientFormModal open={editOpen} onOpenChange={setEditOpen} editClient={client} />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
