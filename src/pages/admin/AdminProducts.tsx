import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
  const { toast } = useToast();
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
        const { error } = await supabase.from("products").update(productData).eq("id", editingProduct.id);
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

  const headerActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90" onClick={() => { setEditingProduct(null); setFormData({ name: "", description: "", price: "", original_price: "", unit: "", image_url: "" }); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-amber-900 border-amber-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-100">{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-amber-200">Product Image</label>
            <div className="flex flex-col items-center gap-3">
              {formData.image_url ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-amber-800">
                  <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => setFormData({ ...formData, image_url: "" })} className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-full h-40 border-2 border-dashed border-amber-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-amber-400 mb-2" />
                  <span className="text-sm text-amber-400">Click to upload image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
              {uploading && <p className="text-sm text-amber-400">Uploading...</p>}
            </div>
            <p className="text-xs text-amber-500">Or paste image URL below</p>
          </div>
          <Input placeholder="Image URL" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          <Input placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          <Input placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          <Input placeholder="Price" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          <Input placeholder="Original Price" type="number" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          <Input placeholder="Unit (e.g., 6 Eggs)" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">{editingProduct ? "Update" : "Add"} Product</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <AdminLayout title="Products" headerActions={headerActions}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-amber-900/50 rounded-xl border border-amber-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-amber-800/50">
              <tr>
                <th className="text-left p-4 text-amber-200 font-medium">Product</th>
                <th className="text-left p-4 text-amber-200 font-medium">Unit</th>
                <th className="text-left p-4 text-amber-200 font-medium">Price</th>
                <th className="text-left p-4 text-amber-200 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-t border-amber-800">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="text-amber-100 font-medium">{product.name}</p>
                        <p className="text-amber-400 text-sm">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-amber-200">{product.unit}</td>
                  <td className="p-4 text-amber-100">₹{product.price}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-amber-300 hover:text-amber-100 hover:bg-amber-800" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-amber-800" onClick={() => handleDelete(product.id)}>
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
    </AdminLayout>
  );
};
