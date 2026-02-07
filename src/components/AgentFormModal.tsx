import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AGENT_TYPES = [
  "Dental",
  "Sales",
  "Real Estate",
  "Support",
  "Healthcare",
  "Education",
  "Custom",
];

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  greeting_message: z.string().optional(),
  system_prompt: z.string().optional(),
  omnidimension_agent_id: z.string().optional(),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

type VoiceAgent = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  greeting_message: string | null;
  system_prompt: string | null;
  omnidimension_agent_id: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editAgent: VoiceAgent | null;
}

export default function AgentFormModal({ open, onOpenChange, editAgent }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEditing = !!editAgent;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      greeting_message: "",
      system_prompt: "",
      omnidimension_agent_id: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editAgent) {
        form.reset({
          name: editAgent.name,
          type: editAgent.type ?? "",
          description: editAgent.description ?? "",
          greeting_message: editAgent.greeting_message ?? "",
          system_prompt: editAgent.system_prompt ?? "",
          omnidimension_agent_id: editAgent.omnidimension_agent_id ?? "",
          is_active: editAgent.is_active !== false,
        });
      } else {
        form.reset({
          name: "",
          type: "",
          description: "",
          greeting_message: "",
          system_prompt: "",
          omnidimension_agent_id: "",
          is_active: true,
        });
      }
    }
  }, [open, editAgent, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        type: values.type,
        description: values.description || null,
        greeting_message: values.greeting_message || null,
        system_prompt: values.system_prompt || null,
        omnidimension_agent_id: values.omnidimension_agent_id || null,
        is_active: values.is_active,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("voice_agents")
          .update(payload)
          .eq("id", editAgent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("voice_agents").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-voice-agents"] });
      toast({ title: isEditing ? "Agent updated" : "Agent created" });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: isEditing ? "Failed to update agent" : "Failed to create agent",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Agent" : "Create New Agent"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the voice agent configuration."
              : "Configure a new voice agent."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-6"
          >
            {/* ── Basic Information ── */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h4>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dental Clinic Assistant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g. Handles appointment booking for dental clinics"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Omnidimension Configuration ── */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Omnidimension Configuration
              </h4>

              <FormField
                control={form.control}
                name="omnidimension_agent_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Omnidimension Agent ID</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. dental_agent_01" {...field} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      This ID maps to the agent created in Omnidimension.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="greeting_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Greeting Message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hello! Thank you for calling [Business Name]. How may I help you today?"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Define AI behavior and instructions for Omnidimension (configuration only)."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ── Status ── */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="mb-0">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* ── Info box ── */}
            <Alert className="border-muted bg-muted/40">
              <Info className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-xs text-muted-foreground">
                Voice agents are configured here and executed by Omnidimension.
                Assignment to clients and phone numbers is managed separately.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Create Agent"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
