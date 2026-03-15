import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import GamesPage from "./pages/GamesPage.tsx";
import WalletPage from "./pages/WalletPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import ColorTradingGame from "./pages/games/ColorTradingGame.tsx";
import BallPoolGame from "./pages/games/BallPoolGame.tsx";
import RummyGame from "./pages/games/RummyGame.tsx";
import CricketPredictions from "./pages/games/CricketPredictions.tsx";
import IPLPredictionGame from "./pages/games/IPLPredictionGame.tsx";
import AdminLayout from "./components/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminGames from "./pages/admin/AdminGames.tsx";
import AdminTransactions from "./pages/admin/AdminTransactions.tsx";
import AdminMatches from "./pages/admin/AdminMatches.tsx";
import AdminFraud from "./pages/admin/AdminFraud.tsx";
import AdminAnalytics from "./pages/admin/AdminAnalytics.tsx";
import AdminSettings from "./pages/admin/AdminSettings.tsx";
import AdminGameResults from "./pages/admin/AdminGameResults.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/games/color-trading" element={<ProtectedRoute><ColorTradingGame /></ProtectedRoute>} />
            <Route path="/games/ball-pool" element={<ProtectedRoute><BallPoolGame /></ProtectedRoute>} />
            <Route path="/games/rummy" element={<ProtectedRoute><RummyGame /></ProtectedRoute>} />
            <Route path="/games/cricket-predictions" element={<ProtectedRoute><CricketPredictions /></ProtectedRoute>} />
            <Route path="/games/ipl-prediction" element={<ProtectedRoute><IPLPredictionGame /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="games" element={<AdminGames />} />
              <Route path="transactions" element={<AdminTransactions />} />
              <Route path="matches" element={<AdminMatches />} />
              <Route path="fraud" element={<AdminFraud />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="game-results" element={<AdminGameResults />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
