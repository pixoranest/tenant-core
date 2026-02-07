import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useInvoices } from "@/hooks/useBillingData";
import { format } from "date-fns";
import { Eye, Download, FileText, Search } from "lucide-react";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20",
  overdue: "bg-destructive/15 text-destructive border-destructive/20",
  draft: "bg-muted text-muted-foreground border-border",
};

export default function InvoicesSection() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const { data: invoices, isLoading } = useInvoices(statusFilter);

  const filtered = (invoices ?? []).filter((inv: any) =>
    search ? inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invoices & Payment History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice #"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading invoices…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((inv: any) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{inv.invoice_number}</p>
                      <Badge variant="outline" className={STATUS_BADGE[inv.status] ?? ""}>
                        {inv.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {inv.billing_period_start && inv.billing_period_end
                        ? `${format(new Date(inv.billing_period_start), "MMM d")} – ${format(new Date(inv.billing_period_end), "MMM d, yyyy")}`
                        : "—"}
                      {inv.due_date && ` · Due ${format(new Date(inv.due_date), "MMM d")}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm">₹{inv.total ?? 0}</p>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedInvoice(inv)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast.info("PDF download coming soon")}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Invoice {selectedInvoice?.invoice_number}
              <Badge
                variant="outline"
                className={STATUS_BADGE[selectedInvoice?.status] ?? ""}
              >
                {selectedInvoice?.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-muted-foreground">Billing Period</p>
                  <p className="font-medium">
                    {selectedInvoice.billing_period_start
                      ? format(new Date(selectedInvoice.billing_period_start), "MMM d")
                      : "—"}{" "}
                    –{" "}
                    {selectedInvoice.billing_period_end
                      ? format(new Date(selectedInvoice.billing_period_end), "MMM d, yyyy")
                      : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {selectedInvoice.due_date
                      ? format(new Date(selectedInvoice.due_date), "MMM d, yyyy")
                      : "—"}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{selectedInvoice.subtotal ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (GST)</span>
                  <span>₹{selectedInvoice.tax ?? 0}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span className="text-primary">₹{selectedInvoice.total ?? 0}</span>
                </div>
              </div>
              {selectedInvoice.status === "pending" && (
                <Button
                  className="w-full"
                  onClick={() => toast.info("Payment gateway coming soon")}
                >
                  Pay Now
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
