import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { PrivacyProvider } from "@/contexts/PrivacyContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Buyers from "./pages/Buyers";
import HomebuyingFinancialHealth from "./pages/HomebuyingFinancialHealth";
import HomebuyingResults from "./pages/HomebuyingResults";
import BuyersPrograms from "./pages/BuyersPrograms";
import TryItFree from "./pages/TryItFree";
import Welcome from "./pages/Welcome";
import Resources from "./pages/Resources";
import News from "./pages/News";
import Auth from "./pages/Auth";
import Analyzer from "./pages/Analyzer";
import NotFound from "./pages/NotFound";
import SavedScenarios from "./pages/SavedScenarios";
import BuyersGuide from "./pages/guides/BuyersGuide";
import InvestorsGuide from "./pages/guides/InvestorsGuide";
import RealisticAffordability from "./pages/guides/RealisticAffordability";
import StateProgramsGuide from "./pages/guides/StateProgramsGuide";
import SmartBuyerStrategies from "./pages/guides/SmartBuyerStrategies";
import Onboarding from "./pages/Onboarding";
import DashboardRedirect from "./pages/DashboardRedirect";
import ClientDashboard from "./pages/dashboards/ClientDashboard";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import PropertySearch from "./pages/properties/PropertySearch";
import PropertyDetail from "./pages/properties/PropertyDetail";
import ClientPreferences from "./pages/dashboards/ClientPreferences";
import ClientSavedEstimates from "./pages/dashboards/ClientSavedEstimates";
import ClientSavedAnalyses from "./pages/dashboards/ClientSavedAnalyses";
import ProfileSettings from "./pages/settings/ProfileSettings";
import AccountSettings from "./pages/settings/AccountSettings";
import Trust from "./pages/Trust";
import { AIChatBot } from "./components/chat/AIChatBot";
import { GuidedTour } from "./components/onboarding/GuidedTour";

import Scout from "./pages/Scout";
import HowItWorks from "./pages/HowItWorks";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <PrivacyProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/buyers" element={<Buyers />} />
                <Route path="/homebuying-estimate/financial-health" element={<HomebuyingFinancialHealth />} />
                <Route path="/homebuying-estimate/results" element={<HomebuyingResults />} />
                <Route path="/buyers/programs" element={<BuyersPrograms />} />
                <Route path="/try-it-free" element={<TryItFree />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/news" element={<News />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/analyzer" element={<Analyzer />} />
                <Route path="/saved" element={<SavedScenarios />} />
                <Route path="/guides/buyers" element={<BuyersGuide />} />
                <Route path="/guides/investors" element={<InvestorsGuide />} />
                <Route path="/guides/realistic-affordability" element={<RealisticAffordability />} />
                <Route path="/guides/programs/:state" element={<StateProgramsGuide />} />
                <Route path="/guides/smart-buyer-strategies" element={<SmartBuyerStrategies />} />
                <Route path="/scout" element={<Scout />} />
                <Route path="/how-it-works" element={<HowItWorks />} />

                <Route path="/onboarding" element={<Onboarding />} />
                

                {/* Protected dashboards */}
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route
                  path="/dashboard/client"
                  element={
                    <ProtectedRoute>
                      <ClientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/client/preferences"
                  element={
                    <ProtectedRoute>
                      <ClientPreferences />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/client/saved-estimates"
                  element={
                    <ProtectedRoute>
                      <ClientSavedEstimates />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard/client/saved-analyses"
                  element={
                    <ProtectedRoute>
                      <ClientSavedAnalyses />
                    </ProtectedRoute>
                  }
                />

                {/* Settings pages */}
                <Route
                  path="/settings/profile"
                  element={
                    <ProtectedRoute>
                      <ProfileSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/account"
                  element={
                    <ProtectedRoute>
                      <AccountSettings />
                    </ProtectedRoute>
                  }
                />

                {/* Trust & security */}
                <Route path="/trust" element={<Trust />} />

                {/* Property pages */}
                <Route path="/properties/search" element={<PropertySearch />} />
                <Route path="/properties/:id" element={<PropertyDetail />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              <AIChatBot />
              <GuidedTour />
            </BrowserRouter>
          </PrivacyProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
