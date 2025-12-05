import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, Package, ShoppingCart, Bell, Tag, 
  LogOut, Menu, X, Plus, Pencil, Trash2, Upload, Image
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number;
  unit: string;
  image_url: string;
  in_stock: boolean;
}

export const AdminProducts = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signOut, isAdmin, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    original_price: "",
    unit: "",
    image_url: ""
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/admin/login");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image_url: reader.result as string });
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.original_price),
        unit: formData.unit,
        image_url: formData.image_url
      };

      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);
        if (error) throw error;
        toast({ title: "Success", description: "Product updated successfully" });
      } else {
        const { error } = await supabase.from("products").insert(productData);
        if (error) throw error;
        toast({ title: "Success", description: "Product added successfully" });
      }

      setDialogOpen(false);
      setEditingProduct(null);
      setFormData({ name: "", description: "", price: "", original_price: "", unit: "", image_url: "" });
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      unit: product.unit || "",
      image_url: product.image_url || ""
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Success", description: "Product deleted successfully" });
      fetchProducts();
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
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-800 transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform duration-200`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">EggPro Admin</h1>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400">
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
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-700">
            <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-700" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 min-h-screen">
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400">
            <Menu className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-white">Products</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingProduct(null); setFormData({ name: "", description: "", price: "", original_price: "", unit: "", image_url: "" }); }}>
                <Plus className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Image Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Product Image</label>
                  <div className="flex flex-col items-center gap-3">
                    {formData.image_url ? (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden bg-slate-700">
                        <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="w-full h-40 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <span className="text-sm text-slate-400">Click to upload image</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    )}
                    {uploading && <p className="text-sm text-slate-400">Uploading...</p>}
                  </div>
                  <p className="text-xs text-slate-500">Or paste image URL below</p>
                </div>
                <Input placeholder="Image URL" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Original Price" type="number" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Input placeholder="Unit (e.g., 6 Eggs)" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="bg-slate-700 border-slate-600 text-white" />
                <Button onClick={handleSubmit} className="w-full">{editingProduct ? "Update" : "Add"} Product</Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-700/50">
                  <tr>
                    <th className="text-left p-4 text-slate-300 font-medium">Product</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Unit</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Price</th>
                    <th className="text-left p-4 text-slate-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-t border-slate-700">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          <div>
                            <p className="text-white font-medium">{product.name}</p>
                            <p className="text-slate-400 text-sm">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300">{product.unit}</td>
                      <td className="p-4 text-white">₹{product.price}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};