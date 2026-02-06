import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface Props {
  clientId: string | null;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeactivateClientDialog({
  clientId,
  clientName,
  open,
  onOpenChange,
}: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) setConfirmed(false);
  }, [open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!clientId) throw new Error("No client selected");

      // Update client status
      const { error: clientErr } = await supabase
        .from("clients")
        .update({ status: "inactive" } as any)
        .eq("id", clientId);
      if (clientErr) throw clientErr;

      // Disable all associated users
      const { error: usersErr } = await supabase
        .from("users")
        .update({ is_active: false } as any)
        .eq("client_id", clientId);
      if (usersErr) throw usersErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["admin-client-detail"] });
      onOpenChange(false);
      toast({ title: "Client deactivated successfully" });
    },
    onError: (e: Error) => {
      toast({
        title: "Deactivation failed",
        description: e.message,
        variant: "destructive",
      });
      // Keep dialog open on error
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!mutation.isPending) onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader className="space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogTitle className="text-center">Deactivate Client?</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to deactivate{" "}
            <span className="font-semibold text-foreground">{clientName}</span>?
            <br />
            The client will lose access to the platform, but data will be
            preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3 my-2">
          <Checkbox
            id="confirm-deactivate"
            checked={confirmed}
            onCheckedChange={(c) => setConfirmed(!!c)}
            className="mt-0.5"
          />
          <Label
            htmlFor="confirm-deactivate"
            className="text-sm font-normal leading-snug cursor-pointer text-muted-foreground"
          >
            I understand this will disable client access
          </Label>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!confirmed || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Deactivating…" : "Deactivate Client"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
