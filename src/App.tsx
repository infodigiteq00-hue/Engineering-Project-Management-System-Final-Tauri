import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuthOptional } from "@/contexts/AuthContext";
import { NotificationReadsProvider } from "@/contexts/NotificationReadsContext";
import RoleBasedRoute from "@/components/RoleBasedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SignUp from "./pages/SignUp";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NoPermission from "./components/NoPermission";
import ClientProjectView from "./pages/ClientProjectView";
import Download from "./pages/Download";

const queryClient = new QueryClient();

const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
} as const;

/** Packaged Tauri uses a non-localhost asset origin; BrowserRouter + History API can white-screen there. Vercel / `tauri dev` stay on BrowserRouter. */
function AppRouter({ children }: { children: React.ReactNode }) {
  const useHash =
    typeof window !== "undefined" &&
    "__TAURI_INTERNALS__" in window &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";
  if (useHash) {
    return <HashRouter future={routerFuture}>{children}</HashRouter>;
  }
  return <BrowserRouter future={routerFuture}>{children}</BrowserRouter>;
}

function NotificationReadsGate({ children }: { children: React.ReactNode }) {
  const auth = useAuthOptional();
  return (
    <NotificationReadsProvider userId={auth?.user?.id ?? null}>
      {children}
    </NotificationReadsProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <NotificationReadsGate>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/view/:token" element={<ClientProjectView />} />
            <Route path="/download" element={<Download />} />

            {/* Protected routes */}
            <Route path="/" element={<RoleBasedRoute />} />
            <Route path="/dashboard" element={<RoleBasedRoute />} />
            <Route path="/super-admin" element={<RoleBasedRoute />} />
            <Route path="/company-dashboard" element={<RoleBasedRoute />} />
            <Route path="/no-permission" element={<NoPermission />} />


            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppRouter>
      </TooltipProvider>
      </NotificationReadsGate>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;