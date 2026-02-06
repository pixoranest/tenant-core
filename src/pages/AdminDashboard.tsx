import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { session, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8">
      <h1 className="text-2xl font-semibold text-foreground">Admin Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Role: <span className="font-mono text-primary">super_admin</span>
      </p>
      <p className="text-muted-foreground text-xs font-mono break-all max-w-md text-center">
        User ID: {session?.user?.id ?? "—"}
      </p>
      <Button variant="outline" onClick={logout}>
        Sign out
      </Button>
    </div>
  );
}
