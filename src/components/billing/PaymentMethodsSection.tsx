import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { usePaymentMethods } from "@/hooks/useBillingData";
import { CreditCard, Landmark, Smartphone, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

const TYPE_ICON: Record<string, React.ElementType> = {
  card: CreditCard,
  upi: Smartphone,
  bank: Landmark,
};

export default function PaymentMethodsSection() {
  const { data: methods, addMethod, removeMethod, setDefault } = usePaymentMethods();
  const [addOpen, setAddOpen] = useState(false);
  const [tab, setTab] = useState("card");
  const [form, setForm] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
    upiId: "",
    isDefault: false,
  });

  const handleAdd = () => {
    if (tab === "card") {
      if (!form.cardNumber || !form.expiry) return toast.error("Fill card details");
      addMethod.mutate(
        {
          type: "card",
          label: `Card ending ${form.cardNumber.slice(-4)}`,
          last_four: form.cardNumber.slice(-4),
          is_default: form.isDefault,
        },
        {
          onSuccess: () => {
            toast.success("Card added successfully");
            setAddOpen(false);
            setForm({ cardNumber: "", expiry: "", cvv: "", upiId: "", isDefault: false });
          },
        }
      );
    } else if (tab === "upi") {
      if (!form.upiId) return toast.error("Enter UPI ID");
      addMethod.mutate(
        {
          type: "upi",
          label: form.upiId,
          last_four: form.upiId.slice(-4),
          is_default: form.isDefault,
        },
        {
          onSuccess: () => {
            toast.success("UPI added successfully");
            setAddOpen(false);
            setForm({ cardNumber: "", expiry: "", cvv: "", upiId: "", isDefault: false });
          },
        }
      );
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add Method
          </Button>
        </CardHeader>
        <CardContent>
          {!methods || methods.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CreditCard className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payment methods added</p>
            </div>
          ) : (
            <div className="space-y-2">
              {methods.map((m: any) => {
                const Icon = TYPE_ICON[m.type] ?? CreditCard;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          {m.label ?? m.type}
                          {m.is_default && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Default
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {m.type} · •••• {m.last_four}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {!m.is_default && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDefault.mutate(m.id, {
                              onSuccess: () => toast.success("Default updated"),
                            })
                          }
                        >
                          <Star className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          removeMethod.mutate(m.id, {
                            onSuccess: () => toast.success("Removed"),
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="card" className="flex-1">Card</TabsTrigger>
              <TabsTrigger value="upi" className="flex-1">UPI</TabsTrigger>
              <TabsTrigger value="bank" className="flex-1">Bank</TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="space-y-3 mt-4">
              <div>
                <Label>Card Number</Label>
                <Input
                  placeholder="4242 4242 4242 4242"
                  value={form.cardNumber}
                  onChange={(e) => setForm((f) => ({ ...f, cardNumber: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Expiry</Label>
                  <Input
                    placeholder="MM/YY"
                    value={form.expiry}
                    onChange={(e) => setForm((f) => ({ ...f, expiry: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>CVV</Label>
                  <Input
                    placeholder="123"
                    type="password"
                    value={form.cvv}
                    onChange={(e) => setForm((f) => ({ ...f, cvv: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
                />
                <Label className="text-sm">Set as default</Label>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={addMethod.isPending}>
                Add Card
              </Button>
            </TabsContent>

            <TabsContent value="upi" className="space-y-3 mt-4">
              <div>
                <Label>UPI ID</Label>
                <Input
                  placeholder="yourname@upi"
                  value={form.upiId}
                  onChange={(e) => setForm((f) => ({ ...f, upiId: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isDefault: v }))}
                />
                <Label className="text-sm">Set as default</Label>
              </div>
              <Button className="w-full" onClick={handleAdd} disabled={addMethod.isPending}>
                Add UPI
              </Button>
            </TabsContent>

            <TabsContent value="bank" className="space-y-3 mt-4">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-2">
                <p className="font-medium">Bank Transfer Details</p>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Bank Name:</span>
                  <span className="text-foreground">HDFC Bank</span>
                  <span>Account No:</span>
                  <span className="text-foreground">50100XXXXXXXX</span>
                  <span>IFSC:</span>
                  <span className="text-foreground">HDFC0001234</span>
                  <span>Account Name:</span>
                  <span className="text-foreground">VoiceAI Solutions Pvt Ltd</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Transfer the invoice amount and share the reference number with support for confirmation.
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
