import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
  client_id: string;
  agent_id: string;
  call_id: string;
  caller_phone: string;
  duration: number;
  status: string;
  outcome: string;
  data_collected?: {
    name?: string;
    email?: string;
    phone?: string;
    appointment_date?: string;
    appointment_time?: string;
    notes?: string;
  };
  recording_url?: string;
  timestamp: string;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return phone.startsWith("+") ? phone : `+${phone}`;
}

function validatePayload(body: unknown): { valid: true; payload: WebhookPayload } | { valid: false; error: string } {
  const p = body as Record<string, unknown>;
  const required = ["client_id", "call_id", "caller_phone", "duration", "status", "timestamp"];
  for (const key of required) {
    if (!p[key]) return { valid: false, error: `Missing required field: ${key}` };
  }
  if (typeof p.duration !== "number" || p.duration < 0) return { valid: false, error: "duration must be a non-negative number" };
  return { valid: true, payload: p as unknown as WebhookPayload };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const result = validatePayload(body);
    if (!result.valid) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { payload } = result;
    payload.caller_phone = formatPhone(payload.caller_phone);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Get client rate
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("rate_per_minute")
      .eq("id", payload.client_id)
      .maybeSingle();

    if (clientErr || !client) {
      return new Response(JSON.stringify({ success: false, error: "Client not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cost = Math.round((payload.duration / 60) * Number(client.rate_per_minute) * 10000) / 10000;

    // 2. Insert call log
    const { data: callLog, error: callErr } = await supabase
      .from("call_logs")
      .insert({
        client_id: payload.client_id,
        agent_id: payload.agent_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.agent_id) ? payload.agent_id : null,
        call_id: payload.call_id,
        caller_phone: payload.caller_phone,
        duration: payload.duration,
        status: payload.status,
        outcome: payload.outcome || null,
        data_collected: payload.data_collected || {},
        recording_url: payload.recording_url || null,
        cost,
        call_timestamp: payload.timestamp,
        direction: "inbound",
      })
      .select("id")
      .single();

    if (callErr) {
      console.error("call_logs insert error:", callErr);
      return new Response(JSON.stringify({ success: false, error: callErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create appointment if data_collected has appointment_date
    let appointmentId: string | null = null;
    const dc = payload.data_collected;
    if (dc?.appointment_date) {
      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .insert({
          client_id: payload.client_id,
          call_log_id: callLog.id,
          customer_name: dc.name || null,
          customer_phone: dc.phone || payload.caller_phone,
          customer_email: dc.email || null,
          appointment_date: dc.appointment_date,
          appointment_time: dc.appointment_time || "09:00",
          notes: dc.notes || null,
          status: "scheduled",
          source: "voice_agent",
        })
        .select("id")
        .single();

      if (apptErr) {
        console.error("appointment insert error:", apptErr);
      } else {
        appointmentId = appt.id;
      }
    }

    // 4. Upsert usage_tracking for current billing cycle
    const now = new Date();
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
    const minutes = Math.round((payload.duration / 60) * 100) / 100;

    const { data: existingUsage } = await supabase
      .from("usage_tracking")
      .select("id, total_calls, total_minutes, total_cost")
      .eq("client_id", payload.client_id)
      .eq("billing_cycle_start", cycleStart)
      .eq("billing_cycle_end", cycleEnd)
      .maybeSingle();

    if (existingUsage) {
      await supabase
        .from("usage_tracking")
        .update({
          total_calls: (existingUsage.total_calls || 0) + 1,
          total_minutes: Number(existingUsage.total_minutes || 0) + minutes,
          total_cost: Number(existingUsage.total_cost || 0) + cost,
        })
        .eq("id", existingUsage.id);
    } else {
      await supabase.from("usage_tracking").insert({
        client_id: payload.client_id,
        billing_cycle_start: cycleStart,
        billing_cycle_end: cycleEnd,
        total_calls: 1,
        total_minutes: minutes,
        total_cost: cost,
        status: "active",
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        call_log_id: callLog.id,
        appointment_id: appointmentId,
        cost,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
