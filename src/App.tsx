import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BackButtonHandler } from "@/components/BackButtonHandler";
import { PlatformGuard } from "@/components/PlatformGuard";
import { AppUpdateChecker } from "@/components/AppUpdateChecker";

// Mobile Pages
import { SplashPage } from "./pages/mobile/SplashPage";
import { MapAnimationPage } from "./pages/mobile/MapAnimationPage";
import { CommunitySelectPage } from "./pages/mobile/CommunitySelectPage";
import { HomePage } from "./pages/mobile/HomePage";
import { OrdersPage } from "./pages/mobile/OrdersPage";
import { ReferPage } from "./pages/mobile/ReferPage";
import { AccountPage } from "./pages/mobile/AccountPage";
import { WalletPage } from "./pages/mobile/WalletPage";
import { AddressPage } from "./pages/mobile/AddressPage";
import { ProductDetailPage } from "./pages/mobile/ProductDetailPage";
import { CartPage } from "./pages/mobile/CartPage";
import { AuthPage } from "./pages/mobile/AuthPage";
import { ResetPasswordPage } from "./pages/mobile/ResetPasswordPage";
import { NotificationsPage } from "./pages/mobile/NotificationsPage";
import { SubscriptionPage } from "./pages/mobile/SubscriptionPage";
import { CheckoutPage } from "./pages/mobile/CheckoutPage";
import { SubscriptionsPage } from "./pages/mobile/SubscriptionsPage";
import { PrivacyPolicyPage } from "./pages/mobile/PrivacyPolicyPage";
import { TermsPage } from "./pages/mobile/TermsPage";
import { AboutPage } from "./pages/mobile/AboutPage";
import { PaymentIssuePage } from "./pages/mobile/PaymentIssuePage";


// Admin Pages
import { AdminLogin } from "./pages/admin/AdminLogin";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminPage } from "./pages/admin/AdminPage";
import { AdminProducts } from "./pages/admin/AdminProducts";
import { AdminOrders } from "./pages/admin/AdminOrders";
import { AdminNotifications } from "./pages/admin/AdminNotifications";
import { AdminOffers } from "./pages/admin/AdminOffers";
import { AdminCommunities } from "./pages/admin/AdminCommunities";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminPaymentIssues } from "./pages/admin/AdminPaymentIssues";


// Merchant Pages
import { MerchantLogin } from "./pages/merchant/MerchantLogin";
import { MerchantOrders } from "./pages/merchant/MerchantOrders";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <PlatformGuard>
            <AppUpdateChecker />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BackButtonHandler />
              <Routes>
                {/* Mobile User Routes */}
                <Route path="/" element={<SplashPage />} />
                <Route path="/map-intro" element={<MapAnimationPage />} />
                <Route path="/community" element={<CommunitySelectPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/refer" element={<ReferPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/addresses" element={<AddressPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/about" element={<AboutPage />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/offers" element={<AdminOffers />} />
                <Route path="/admin/communities" element={<AdminCommunities />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/users" element={<AdminUsers />} />

                {/* Merchant Routes */}
                <Route path="/merchant/login" element={<MerchantLogin />} />
                <Route path="/merchant/orders" element={<MerchantOrders />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </PlatformGuard>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
