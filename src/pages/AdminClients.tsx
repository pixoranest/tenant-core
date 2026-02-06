import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  ShieldOff,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

type Client = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  business_type: string | null;
  billing_plan: string | null;
  created_at: string;
};

type EditableClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_type: string;
  billing_plan: string;
};

const STATUS_OPTIONS = ["all", "active", "inactive", "trial", "suspended"] as const;

const statusColor: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-muted text-muted-foreground border-border",
  trial: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  suspended: "bg-destructive/15 text-destructive border-destructive/20",
};

const planLabel: Record<string, string> = {
  payg: "Pay As You Go",
  monthly_500: "Monthly 500",
  monthly_1000: "Monthly 1000",
  enterprise: "Enterprise",
};

const PAGE_SIZE = 20;

export default function AdminClients() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [editClient, setEditClient] = useState<EditableClient | null>(null);
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email, phone, status, business_type, billing_plan, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (c: EditableClient) => {
      const { error } = await supabase
        .from("clients")
        .update({
          name: c.name,
          email: c.email,
          phone: c.phone || null,
          business_type: c.business_type || null,
          billing_plan: c.billing_plan || null,
        })
        .eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setEditClient(null);
      toast({ title: "Client updated" });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clients")
        .update({ status: "inactive" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      setDeactivateId(null);
      toast({ title: "Client deactivated" });
    },
    onError: (e: Error) => toast({ title: "Deactivation failed", description: e.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter !== "all") list = list.filter((c) => c.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [clients, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(0); };
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(0); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add New Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && filtered.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No clients yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first client to get started.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Desktop table */}
      {!isLoading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Billing Plan</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{c.name}</p>
                      {c.business_type && (
                        <p className="text-xs text-muted-foreground">{c.business_type}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[c.status] ?? ""}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {planLabel[c.billing_plan ?? ""] ?? c.billing_plan ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(c.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" title="View">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          onClick={() =>
                            setEditClient({
                              id: c.id,
                              name: c.name,
                              email: c.email,
                              phone: c.phone ?? "",
                              business_type: c.business_type ?? "",
                              billing_plan: c.billing_plan ?? "payg",
                            })
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {c.status !== "inactive" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Deactivate"
                            onClick={() => setDeactivateId(c.id)}
                          >
                            <ShieldOff className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {paged.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    {c.business_type && (
                      <p className="text-xs text-muted-foreground">{c.business_type}</p>
                    )}
                  </div>
                  <Badge variant="outline" className={statusColor[c.status] ?? ""}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{c.email}</p>
                  <p>{c.phone ?? "—"}</p>
                  <p>{planLabel[c.billing_plan ?? ""] ?? c.billing_plan ?? "—"}</p>
                  <p>{format(new Date(c.created_at), "MMM d, yyyy")}</p>
                  <div className="flex gap-1 pt-2">
                    <Button variant="ghost" size="icon" title="View"><Eye className="h-4 w-4" /></Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      onClick={() =>
                        setEditClient({
                          id: c.id,
                          name: c.name,
                          email: c.email,
                          phone: c.phone ?? "",
                          business_type: c.business_type ?? "",
                          billing_plan: c.billing_plan ?? "payg",
                        })
                      }
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {c.status !== "inactive" && (
                      <Button variant="ghost" size="icon" title="Deactivate" onClick={() => setDeactivateId(c.id)}>
                        <ShieldOff className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={(open) => !open && setEditClient(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update client information.</DialogDescription>
          </DialogHeader>
          {editClient && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" value={editClient.name} onChange={(e) => setEditClient({ ...editClient, name: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={editClient.email} onChange={(e) => setEditClient({ ...editClient, email: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" value={editClient.phone} onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-btype">Business Type</Label>
                <Input id="edit-btype" value={editClient.business_type} onChange={(e) => setEditClient({ ...editClient, business_type: e.target.value })} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="edit-plan">Billing Plan</Label>
                <Select value={editClient.billing_plan} onValueChange={(v) => setEditClient({ ...editClient, billing_plan: v })}>
                  <SelectTrigger id="edit-plan"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="payg">Pay As You Go</SelectItem>
                    <SelectItem value="monthly_500">Monthly 500</SelectItem>
                    <SelectItem value="monthly_1000">Monthly 1000</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClient(null)}>Cancel</Button>
            <Button disabled={updateMutation.isPending} onClick={() => editClient && updateMutation.mutate(editClient)}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation */}
      <AlertDialog open={!!deactivateId} onOpenChange={(open) => !open && setDeactivateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Client</AlertDialogTitle>
            <AlertDialogDescription>
              This will set the client's status to inactive. They will lose access until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deactivateMutation.isPending}
              onClick={() => deactivateId && deactivateMutation.mutate(deactivateId)}
            >
              {deactivateMutation.isPending ? "Deactivating…" : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
