import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, Package, ShoppingCart, Bell, Tag, 
  LogOut, Menu, X, Plus, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Offer {
  id: string;
  title: string;
  description: string;
  discount_percentage: number;
  code: string;
  is_active: boolean;
  valid_until: string;
  created_at: string;
}

export const AdminOffers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signOut, isAdmin, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", discount_percentage: "", code: "", valid_until: "" });

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchOffers();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      setOffers(data || []);
    } catch (error) {
      console.error("Error fetching offers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.discount_percentage) {
      toast({ title: "Error", description: "Please fill required fields", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase.from("offers").insert({
        title: formData.title,
        description: formData.description,
        discount_percentage: parseInt(formData.discount_percentage),
        code: formData.code,
        valid_until: formData.valid_until || null,
        is_active: true
      });
      if (error) throw error;
      toast({ title: "Success", description: "Offer created successfully" });
      setDialogOpen(false);
      setFormData({ title: "", description: "", discount_percentage: "", code: "", valid_until: "" });
      fetchOffers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("offers").update({ is_active: !currentStatus }).eq("id", id);
      if (error) throw error;
      fetchOffers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Offer deleted" });
      fetchOffers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: Bell, label: "Notifications", path: "/admin/notifications" },
    { icon: Tag, label: "Offers", path: "/admin/offers" },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">EggPro Admin</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400"><X className="w-6 h-6" /></button>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => (
              <Link key={item.path} to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
                <item.icon className="w-5 h-5" />{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-700">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleLogout}><LogOut className="w-5 h-5 mr-3" />Logout</Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400"><Menu className="w-6 h-6" /></button>
          <h2 className="text-xl font-semibold text-white">Offers</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 mr-2" /> New Offer</Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader><DialogTitle className="text-white">Create Offer</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Offer Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Discount %" type="number" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Coupon Code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input type="date" value={formData.valid_until} onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Button onClick={handleSubmit} className="w-full">Create Offer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : offers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No offers yet</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {offers.map((offer) => (
                <div key={offer.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-semibold">{offer.title}</h3>
                        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">{offer.discount_percentage}% OFF</span>
                      </div>
                      <p className="text-slate-400 text-sm mt-1">{offer.description}</p>
                      {offer.code && <p className="text-primary font-mono text-sm mt-2">Code: {offer.code}</p>}
                      {offer.valid_until && <p className="text-slate-500 text-xs mt-1">Valid until: {new Date(offer.valid_until).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={offer.is_active} onCheckedChange={() => toggleActive(offer.id, offer.is_active)} />
                      <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(offer.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};