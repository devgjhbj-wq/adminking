import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "./pages/Login";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import UserSearch from "./pages/UserSearch";
import Transactions from "./pages/Transactions";
import Deposits from "./pages/Deposits";
import Withdrawals from "./pages/Withdrawals";
import GiftCodes from "./pages/GiftCodes";
import AgentStats from "./pages/AgencyDashboard";
import AdminLogs from "./pages/AdminLogs";
import VipConfig from "./pages/VipConfig";
import TurnoverConfig from "./pages/TurnoverConfig";
import BetRecords from "./pages/BetRecords";
import MoveGameBalance from "./pages/MoveGameBalance";
import WingoDashboard from "./pages/WingoDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserSearch />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="deposits" element={<Deposits />} />
              <Route path="withdrawals" element={<Withdrawals />} />
              <Route path="gift-codes" element={<GiftCodes />} />
              <Route path="agency" element={<AgentStats />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="vip-config" element={<VipConfig />} />
              <Route path="turnover-config" element={<TurnoverConfig />} />
              <Route path="bet-records" element={<BetRecords />} />
              <Route path="move-game" element={<MoveGameBalance />} />
              <Route path="wingo" element={<WingoDashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
