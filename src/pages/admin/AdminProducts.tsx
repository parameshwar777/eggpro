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
  buy_once_price: number;
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
    buy_once_price: "",
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
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload Failed", description: error.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.original_price),
        buy_once_price: parseFloat(formData.buy_once_price),
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
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", price: "", original_price: "", buy_once_price: "", unit: "", image_url: "" });
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      original_price: product.original_price?.toString() || "",
      buy_once_price: product.buy_once_price?.toString() || "",
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
        <Button className="bg-primary hover:bg-primary/90" onClick={() => { setEditingProduct(null); resetForm(); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-amber-900 border-amber-800 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-amber-100">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Image Upload */}
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

          {/* Image URL */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Image URL</label>
            <Input placeholder="https://example.com/image.jpg" value={formData.image_url} onChange={(e) => setFormData({ ...formData, image_url: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          </div>

          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Product Name</label>
            <Input placeholder="e.g. Premium White Eggs" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Description</label>
            <Input placeholder="e.g. Farm fresh white eggs" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          </div>

          {/* Original Price (MRP) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Original Price (MRP) ₹</label>
            <Input placeholder="e.g. 80" type="number" value={formData.original_price} onChange={(e) => setFormData({ ...formData, original_price: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          </div>

          {/* Buy Once Price */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Buy Once Price ₹</label>
            <Input placeholder="e.g. 62" type="number" value={formData.buy_once_price} onChange={(e) => setFormData({ ...formData, buy_once_price: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
            <p className="text-xs text-amber-500">Discounted price for one-time purchases</p>
          </div>

          {/* Subscription Price */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Subscription Price ₹</label>
            <Input placeholder="e.g. 58" type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
            <p className="text-xs text-amber-500">Discounted price for subscribers</p>
          </div>

          {/* Unit */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-amber-200">Unit / Pack Size</label>
            <Input placeholder="e.g. 6 Eggs" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="bg-amber-800 border-amber-700 text-amber-100" />
          </div>

          <Button onClick={handleSubmit} className="w-full bg-primary hover:bg-primary/90">{editingProduct ? "Update Product" : "Add Product"}</Button>
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
        <div className="space-y-3">
          {products.map((product) => (
            <div key={product.id} className="bg-amber-900/50 rounded-xl border border-amber-800 p-4">
              <div className="flex items-start gap-3">
                <img src={product.image_url} alt={product.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-amber-100 font-semibold text-sm">{product.name}</p>
                      <p className="text-amber-400 text-xs mt-0.5">{product.unit}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-300 hover:text-amber-100 hover:bg-amber-800" onClick={() => handleEdit(product)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-amber-800" onClick={() => handleDelete(product.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <div>
                      <p className="text-[10px] text-amber-500 uppercase">MRP</p>
                      <p className="text-amber-300 text-sm line-through">₹{product.original_price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-amber-500 uppercase">Buy Once</p>
                      <p className="text-amber-100 text-sm font-semibold">₹{product.buy_once_price}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-green-500 uppercase">Subscribe</p>
                      <p className="text-green-400 text-sm font-semibold">₹{product.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};
