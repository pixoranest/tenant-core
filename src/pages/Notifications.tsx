import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationsList, useNotificationMutations } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Phone, CalendarDays, AlertTriangle, CreditCard, Settings, CheckCheck, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const filters = [
  { label: "All", value: "all" },
  { label: "Unread", value: "unread" },
  { label: "Calls", value: "call" },
  { label: "Appointments", value: "appointment" },
  { label: "Usage", value: "usage" },
  { label: "Billing", value: "billing" },
  { label: "System", value: "system" },
];

const typeIcons: Record<string, React.ElementType> = {
  call: Phone,
  appointment: CalendarDays,
  usage: AlertTriangle,
  billing: CreditCard,
  system: Settings,
};

export default function Notifications() {
  const { userProfile } = useAuth();
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const { data, isLoading } = useNotificationsList(filter, page);
  const { markRead, markAllRead, deleteAll } = useNotificationMutations();

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated with your latest activity</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => userProfile?.client_id && markAllRead.mutate(userProfile.client_id)}
            disabled={markAllRead.isPending}
          >
            <CheckCheck className="h-4 w-4" /> Mark All Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => userProfile?.client_id && deleteAll.mutate(userProfile.client_id)}
            disabled={deleteAll.isPending}
          >
            <Trash2 className="h-4 w-4" /> Delete All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <Button
            key={f.value}
            size="sm"
            variant={filter === f.value ? "default" : "outline"}
            onClick={() => { setFilter(f.value); setPage(0); }}
            className="h-8 text-xs"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-border">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="px-4 py-4">
                  <Skeleton className="h-12 w-full rounded" />
                </div>
              ))}
            </div>
          ) : !data?.items.length ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Bell className="mb-3 h-12 w-12 text-muted-foreground/30" />
              <p className="text-base font-medium text-muted-foreground">No notifications</p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                {filter === "unread" ? "You're all caught up!" : "Nothing to show for this filter."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {data.items.map((n) => {
                const Icon = typeIcons[n.type] ?? Settings;
                return (
                  <li
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 ${!n.is_read ? "bg-accent/20" : ""}`}
                  >
                    <div className="mt-0.5 rounded-md bg-accent p-2">
                      <Icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!n.is_read && (
                        <>
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary"
                            onClick={() => markRead.mutate(n.id)}
                          >
                            Mark read
                          </Button>
                        </>
                      )}
                      <Badge variant="outline" className="text-[10px]">{n.type}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
