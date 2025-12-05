import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const labelOptions = ["Home", "Work", "Other"];

export const AddressPage = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("Home");
  const [addresses] = useState<any[]>([]);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-primary/10 px-4 py-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card shadow-soft"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-semibold text-foreground">Delivery Addresses</h1>
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
        {addresses.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl p-8 shadow-card flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-5xl mb-3"
            >
              📍
            </motion.div>
            <p className="text-muted-foreground mb-4">No addresses added yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {/* Address cards would go here */}
          </div>
        )}
      </div>

      {/* Add Address Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Address</DialogTitle>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            {/* Address Label */}
            <div>
              <label className="text-sm font-medium text-foreground">Address Label</label>
              <div className="flex gap-2 mt-2">
                {labelOptions.map((label) => (
                  <motion.button
                    key={label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedLabel(label)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedLabel === label
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Phone Number <span className="text-destructive">*</span>
              </label>
              <Input placeholder="10-digit mobile number" className="mt-1" />
            </div>

            {/* Address Line */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Flat/House No, Building <span className="text-destructive">*</span>
              </label>
              <Input placeholder="Enter address line 1" className="mt-1" />
            </div>

            {/* Landmark */}
            <div>
              <label className="text-sm font-medium text-foreground">Area, Landmark</label>
              <Input placeholder="Enter landmark (optional)" className="mt-1" />
            </div>

            {/* City & Pincode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">City</label>
                <Input placeholder="City" className="mt-1" defaultValue="Hyderabad" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Pincode <span className="text-destructive">*</span>
                </label>
                <Input placeholder="Enter pincode" className="mt-1" />
              </div>
            </div>

            {/* Default Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox id="default" defaultChecked />
              <label htmlFor="default" className="text-sm text-foreground">
                Set as default address
              </label>
            </div>

            {/* Save Button */}
            <Button className="w-full" onClick={() => setShowForm(false)}>
              Save Address
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
