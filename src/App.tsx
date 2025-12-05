import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";

// Mobile Pages
import { HomePage } from "./pages/mobile/HomePage";
import { OrdersPage } from "./pages/mobile/OrdersPage";
import { ReferPage } from "./pages/mobile/ReferPage";
import { AccountPage } from "./pages/mobile/AccountPage";
import { WalletPage } from "./pages/mobile/WalletPage";
import { AddressPage } from "./pages/mobile/AddressPage";
import { ProductDetailPage } from "./pages/mobile/ProductDetailPage";
import { CartPage } from "./pages/mobile/CartPage";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/refer" element={<ReferPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/wallet" element={<WalletPage />} />
            <Route path="/addresses" element={<AddressPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
