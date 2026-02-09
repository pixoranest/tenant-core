import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";
import ConnectionStatus from "@/components/notifications/ConnectionStatus";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Phone,
  BarChart3,
  CalendarCheck,
  CreditCard,
  Settings,
  LogOut,
  Mic,
  Bell,
} from "lucide-react";
import pixoranestLogo from "@/assets/pixoranest-logo.png";

const navItems = [
  { title: "Home", url: "/dashboard", icon: Home },
  { title: "Call Logs", url: "/dashboard/call-logs", icon: Phone },
  { title: "Recordings", url: "/dashboard/recordings", icon: Mic },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Appointments", url: "/dashboard/appointments", icon: CalendarCheck },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Billing", url: "/dashboard/billing", icon: CreditCard },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export default function ClientLayout() {
  const { userProfile, logout } = useAuth();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b border-sidebar-border px-4 py-4">
            <div className="flex items-center gap-2">
              <img src={pixoranestLogo} alt="PixoraNest" className="h-8 w-auto" />
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="hover:bg-sidebar-accent/50"
                          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        >
                          <item.icon className="mr-2 h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <div className="flex flex-col gap-2">
              <div className="px-2">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userProfile?.name ?? userProfile?.email ?? "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">Client</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-14 items-center justify-between border-b border-border px-4">
            <SidebarTrigger className="mr-2" />
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <NotificationBell />
            </div>
          </header>
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
