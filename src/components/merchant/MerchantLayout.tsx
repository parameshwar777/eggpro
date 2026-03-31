import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ShoppingCart, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationManager } from "@/components/NotificationManager";
import { useAuth } from "@/contexts/AuthContext";

interface MerchantLayoutProps {
  children: React.ReactNode;
  title: string;
  headerActions?: React.ReactNode;
}

export const MerchantLayout = ({ children, title, headerActions }: MerchantLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isMerchant, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isMerchant) {
      navigate("/merchant/login");
    }
  }, [isMerchant, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/merchant/login");
  };

  const menuItems = [
    { icon: ShoppingCart, label: "Orders", path: "/merchant/orders" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="page-scroll bg-slate-950 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200 overflow-y-auto safe-top`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
            <h1 className="text-xl font-bold text-slate-100">EggPro Merchant</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-300">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-slate-200 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 sticky bottom-0 bg-slate-900">
            <Button
              variant="ghost"
              className="w-full justify-start text-slate-200 hover:text-slate-100 hover:bg-slate-800"
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
        <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between sticky top-0 z-30 safe-top">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-300">
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <NotificationManager />
            {headerActions}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6 safe-bottom">
          {children}
        </div>
      </main>
    </div>
  );
};
