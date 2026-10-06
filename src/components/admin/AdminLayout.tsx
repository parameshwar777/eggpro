import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, ShoppingCart, Bell, Tag, 
  LogOut, Menu, X, Users, Settings, AlertCircle, Drumstick, MapPin, CalendarClock, ClipboardList, ScanLine, UserCog, Coffee
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_LOGO_URL } from "@/components/BrandLogo";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}

export const AdminLayout = ({ children, title, headerActions }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isAdmin, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const menuItems: { icon: any; label: string; path: string; section?: string }[] = [
    { section: "EggPro", icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: AlertCircle, label: "Payment Issues", path: "/admin/payment-issues" },

    { icon: Users, label: "Communities", path: "/admin/communities" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    { icon: Tag, label: "Offers", path: "/admin/offers" },
    { section: "Chicken", icon: Drumstick, label: "Products & Pricing", path: "/admin/chicken/products" },
    { icon: MapPin, label: "Pickup Centers", path: "/admin/chicken/centers" },
    { icon: CalendarClock, label: "Pickup Schedule", path: "/admin/chicken/schedule" },
    { icon: ClipboardList, label: "Chicken Orders", path: "/admin/chicken/orders" },
    { icon: ScanLine, label: "Pickup Verification", path: "/admin/chicken/verify" },
    { icon: UserCog, label: "Chicken Staff", path: "/admin/chicken/staff" },
    { section: "Café", icon: Coffee, label: "Café Locations", path: "/admin/cafe" },
    { section: "Settings", icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-amber-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-amber-950 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-amber-900 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200 overflow-y-auto`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-amber-800 flex items-center justify-between sticky top-0 bg-amber-900 z-10">
            <div className="flex items-center gap-2"><img src={BRAND_LOGO_URL} alt="EggPro" className="w-9 h-9 rounded-full object-cover" /><h1 className="text-xl font-bold text-amber-100">EggPro Admin</h1></div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-amber-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <div key={item.path}>
                {item.section && <p className="px-4 pt-3 pb-1 text-[11px] font-extrabold tracking-widest text-amber-400 uppercase">{item.section}</p>}
                <Link
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-amber-200 hover:bg-amber-800 hover:text-amber-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-amber-800 sticky bottom-0 bg-amber-900">
            <Button
              variant="ghost"
              className="w-full justify-start text-amber-200 hover:text-amber-100 hover:bg-amber-800"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="bg-amber-900 border-b border-amber-800 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-amber-300">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-amber-100">{title}</h2>
          </div>
          {headerActions}
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
