import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Shield, Trash2, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminUser {
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  email?: string;
}

export const AdminUsers = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    if (error || !roles) {
      setIsLoading(false);
      return;
    }

    const adminList: AdminUser[] = [];
    for (const role of roles) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", role.user_id)
        .single();
      
      adminList.push({
        user_id: role.user_id,
        role: role.role,
        profile: profile || undefined,
      });
    }

    setAdmins(adminList);
    setIsLoading(false);
  };

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      toast({ title: "Enter an email to search", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    
    // Search via edge function that can look up auth users by email
    const { data, error } = await supabase.functions.invoke("search-user-by-email", {
      body: { email: searchEmail.trim() }
    });

    if (!error && data?.users) {
      const existingAdminIds = admins.map(a => a.user_id);
      setFoundUsers(data.users.filter((u: any) => !existingAdminIds.includes(u.id)));
    } else {
      setFoundUsers([]);
    }
    setIsSearching(false);
  };

  const makeAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      
      if (error) throw error;

      toast({ title: "Admin role assigned!" });
      setDialogOpen(false);
      setSearchEmail("");
      setFoundUsers([]);
      fetchAdmins();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const removeAdmin = async (userId: string) => {
    if (!confirm("Remove admin access for this user?")) return;
    
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) throw error;

      toast({ title: "Admin access removed" });
      fetchAdmins();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <AdminLayout title="Manage Admins" headerActions={
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <UserPlus className="w-4 h-4 mr-1" /> Add Admin
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Search by Email</label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Enter user email"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                />
                <Button onClick={searchUsers} disabled={isSearching}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {foundUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Found Users:</p>
                {foundUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{u.full_name || "No Name"}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Button size="sm" onClick={() => makeAdmin(u.id)}>
                      <Shield className="w-4 h-4 mr-1" /> Make Admin
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {foundUsers.length === 0 && searchEmail && !isSearching && (
              <p className="text-sm text-muted-foreground text-center py-4">No users found with this email</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    }>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="space-y-3">
          {admins.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No admins found</p>
            </div>
          ) : (
            admins.map((admin) => (
              <motion.div
                key={admin.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-secondary rounded-xl p-4 border border-border flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">
                      {(admin.profile?.full_name || "A")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {admin.profile?.full_name || "Unknown"}
                    </p>
                    <p className="text-sm text-muted-foreground">{admin.profile?.phone || "No phone"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary">Admin</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeAdmin(admin.user_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
};
