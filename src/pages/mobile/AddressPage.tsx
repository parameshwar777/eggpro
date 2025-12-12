import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, MapPin, Home, Briefcase, Trash2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MobileLayout } from "@/components/mobile/MobileLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Address {
  id: string;
  label: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  pincode: string;
  is_default: boolean;
}

const labelOptions = [
  { value: "Home", icon: Home },
  { value: "Work", icon: Briefcase },
  { value: "Other", icon: MapPin },
];

export const AddressPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form states
  const [selectedLabel, setSelectedLabel] = useState("Home");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("Hyderabad");
  const [pincode, setPincode] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (!error && data) {
      setAddresses(data);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setSelectedLabel("Home");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("Hyderabad");
    setPincode("");
    setIsDefault(true);
  };

  const handleSaveAddress = async () => {
    if (!user) {
      toast({ title: "Please login", variant: "destructive" });
      return;
    }

    if (!phone || !addressLine1 || !pincode) {
      toast({ title: "Fill required fields", variant: "destructive" });
      return;
    }

    try {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from("user_addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { error } = await supabase
        .from("user_addresses")
        .insert({
          user_id: user.id,
          label: selectedLabel,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          city,
          pincode,
          is_default: isDefault
        });

      if (error) throw error;

      toast({ title: "Address saved!" });
      setShowForm(false);
      resetForm();
      fetchAddresses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const { error } = await supabase
        .from("user_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Address deleted" });
      fetchAddresses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;

    try {
      // Unset all defaults
      await supabase
        .from("user_addresses")
        .update({ is_default: false })
        .eq("user_id", user.id);

      // Set new default
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Default address updated" });
      fetchAddresses();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const getLabelIcon = (label: string) => {
    const option = labelOptions.find(o => o.value === label);
    const Icon = option?.icon || MapPin;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <MobileLayout hideNav>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-primary/10 px-4 py-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-base sm:text-lg font-semibold text-foreground">Delivery Addresses</h1>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowForm(true)}
          className="p-2 rounded-full bg-primary text-primary-foreground"
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Addresses List */}
      <div className="p-4">
        {!user ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center"
          >
            <MapPin className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4 text-center">Please login to manage addresses</p>
            <Button onClick={() => navigate("/auth")}>Login</Button>
          </motion.div>
        ) : isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : addresses.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-6 sm:p-8 shadow-card flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-4xl sm:text-5xl mb-3"
            >
              📍
            </motion.div>
            <p className="text-muted-foreground mb-4 text-sm">No addresses added yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {addresses.map((addr, i) => (
                <motion.div
                  key={addr.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`bg-card rounded-xl p-4 shadow-card relative ${
                    addr.is_default ? "border-2 border-primary" : "border border-border"
                  }`}
                >
                  {addr.is_default && (
                    <div className="absolute -top-2 right-4 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                      Default
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-full mt-0.5">
                        {getLabelIcon(addr.label)}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{addr.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {addr.address_line1}
                          {addr.address_line2 && `, ${addr.address_line2}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {addr.city} - {addr.pincode}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          📞 {addr.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {!addr.is_default && (
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSetDefault(addr.id)}
                          className="p-2 rounded-full bg-green-100 text-green-600"
                        >
                          <Check className="w-4 h-4" />
                        </motion.button>
                      )}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="p-2 rounded-full bg-red-100 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Address Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-sm mx-auto max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Add Address</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-2"
          >
            {/* Address Label */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Address Label</label>
              <div className="flex gap-2 mt-2">
                {labelOptions.map(({ value, icon: Icon }) => (
                  <motion.button
                    key={value}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedLabel(value)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all ${
                      selectedLabel === value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {value}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input 
                placeholder="10-digit mobile number" 
                className="mt-1 text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
              />
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Flat/House No, Building <span className="text-destructive">*</span>
              </label>
              <Input 
                placeholder="Enter address line 1" 
                className="mt-1 text-sm"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-foreground">Area, Landmark</label>
              <Input 
                placeholder="Enter landmark (optional)" 
                className="mt-1 text-sm"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
              />
            </div>

            {/* City & Pincode */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground">City</label>
                <Input 
                  placeholder="City" 
                  className="mt-1 text-sm" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Pincode <span className="text-destructive">*</span>
                </label>
                <Input 
                  placeholder="Pincode" 
                  className="mt-1 text-sm"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox 
                id="default" 
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <label htmlFor="default" className="text-xs sm:text-sm text-foreground">
                Set as default address
              </label>
            </div>

            {/* Save Button */}
            <Button className="w-full" onClick={handleSaveAddress}>
              Save Address
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};
