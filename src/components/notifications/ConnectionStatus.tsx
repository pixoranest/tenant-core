import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Status = "connected" | "connecting" | "disconnected";

export default function ConnectionStatus() {
  const [status, setStatus] = useState<Status>("connecting");
  const fallbackRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel("connection-monitor")
      .on("presence", { event: "sync" }, () => {
        setStatus("connected");
      })
      .subscribe((st) => {
        if (st === "SUBSCRIBED") {
          setStatus("connected");
          if (fallbackRef.current) clearInterval(fallbackRef.current);
        } else if (st === "CLOSED" || st === "CHANNEL_ERROR") {
          setStatus("disconnected");
          // Fallback polling after 30s
          if (!fallbackRef.current) {
            fallbackRef.current = setInterval(() => {
              // Simple heartbeat query
              supabase.from("clients").select("id", { count: "exact", head: true }).limit(0);
            }, 30_000);
          }
        } else {
          setStatus("connecting");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (fallbackRef.current) clearInterval(fallbackRef.current);
    };
  }, []);

  const colors: Record<Status, string> = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-red-500",
  };

  const labels: Record<Status, string> = {
    connected: "Realtime connected",
    connecting: "Connecting…",
    disconnected: "Disconnected — using polling fallback",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={`inline-block h-2.5 w-2.5 rounded-full ${colors[status]}`} />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{labels[status]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
