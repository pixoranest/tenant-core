import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SuperAdminRoute from "./components/routes/SuperAdminRoute";
import ClientRoute from "./components/routes/ClientRoute";
import SuperAdminLayout from "./components/layouts/SuperAdminLayout";
import ClientLayout from "./components/layouts/ClientLayout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminClients from "./pages/AdminClients";
import AdminClientDetails from "./pages/AdminClientDetails";
import AdminAgents from "./pages/AdminAgents";
import Dashboard from "./pages/Dashboard";
import CallLogs from "./pages/CallLogs";
import Analytics from "./pages/Analytics";
import Recordings from "./pages/Recordings";
import Appointments from "./pages/Appointments";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Super Admin routes */}
          <Route element={<SuperAdminRoute />}>
            <Route element={<SuperAdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/clients" element={<AdminClients />} />
              <Route path="/admin/clients/:clientId" element={<AdminClientDetails />} />
              <Route path="/admin/agents" element={<AdminAgents />} />
            </Route>
          </Route>

          {/* Client routes */}
          <Route element={<ClientRoute />}>
            <Route element={<ClientLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/call-logs" element={<CallLogs />} />
              <Route path="/dashboard/analytics" element={<Analytics />} />
              <Route path="/dashboard/recordings" element={<Recordings />} />
              <Route path="/dashboard/appointments" element={<Appointments />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
