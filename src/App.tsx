import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
// Journal App imports
import { ThemeProvider } from "@/components/journal/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navigation } from "@/components/journal/Navigation";
import { ProtectedRoute } from "@/components/journal/ProtectedRoute";
import JournalAuth from "./pages/journal/Auth";
import AddTrade from "./pages/journal/AddTrade";
import TradeHistory from "./pages/journal/TradeHistory";
import Analytics from "./pages/journal/Analytics";
import TradingMentor from "./pages/journal/TradingMentor";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              
              {/* Journal App Routes */}
              <Route path="/journal/auth" element={<JournalAuth />} />
              <Route path="/journal/add-trade" element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="container mx-auto px-4 py-8">
                    <AddTrade />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/journal/history" element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="container mx-auto px-4 py-8">
                    <TradeHistory />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/journal/analytics" element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="container mx-auto px-4 py-8">
                    <Analytics />
                  </main>
                </ProtectedRoute>
              } />
              <Route path="/journal/mentor" element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="container mx-auto px-4 py-8">
                    <TradingMentor />
                  </main>
                </ProtectedRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
