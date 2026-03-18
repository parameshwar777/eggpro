import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserPlus, Shield, Trash2, Search, Users, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RoleUser {
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
  email?: string | null;
}

const UserCard = ({ user, onRemove, roleName }: { user: RoleUser; onRemove: (id: string) => void; roleName: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-secondary rounded-xl p-4 border border-border flex items-center justify-between"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
        <span className="text-primary-foreground font-bold">
          {(user.profile?.full_name || user.email || "U")[0].toUpperCase()}
        </span>
      </div>
      <div>
        <p className="font-semibold text-foreground">{user.profile?.full_name || "Unknown"}</p>
        <p className="text-sm text-muted-foreground">{user.email || "No email"}</p>
        {user.profile?.phone && (
          <p className="text-xs text-muted-foreground">{user.profile.phone}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2">
      <Badge className={roleName === "admin" ? "bg-primary" : "bg-amber-600"}>
        {roleName === "admin" ? "Admin" : "Merchant"}
      </Badge>
      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onRemove(user.user_id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  </motion.div>
);

const AddUserDialog = ({
  open, onOpenChange, roleName, onAdded,
}: { open: boolean; onOpenChange: (v: boolean) => void; roleName: "admin" | "merchant"; onAdded: () => void }) => {
  const { toast } = useToast();
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async () => {
    if (!searchEmail.trim()) {
      toast({ title: "Enter an email to search", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    const { data, error } = await supabase.functions.invoke("search-user-by-email", {
      body: { email: searchEmail.trim() },
    });
    if (!error && data?.users) {
      setFoundUsers(data.users);
    } else {
      setFoundUsers([]);
    }
    setIsSearching(false);
  };

  const assignRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: roleName });
      if (error) throw error;
      toast({ title: `${roleName === "admin" ? "Admin" : "Merchant"} role assigned!` });
      onOpenChange(false);
      setSearchEmail("");
      setFoundUsers([]);
      onAdded();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New {roleName === "admin" ? "Admin" : "Merchant"}</DialogTitle>
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
                  <Button size="sm" onClick={() => assignRole(u.id)}>
                    {roleName === "admin" ? <Shield className="w-4 h-4 mr-1" /> : <Store className="w-4 h-4 mr-1" />}
                    Make {roleName === "admin" ? "Admin" : "Merchant"}
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
  );
};

export const AdminUsers = () => {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<RoleUser[]>([]);
  const [merchants, setMerchants] = useState<RoleUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [merchantDialogOpen, setMerchantDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "merchant"]);

    if (!roles) { setIsLoading(false); return; }

    // Fetch profiles for all role users
    const userIds = roles.map(r => r.user_id);
    const profileMap: Record<string, any> = {};
    
    for (const role of roles) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", role.user_id)
        .single();
      if (profile) profileMap[role.user_id] = profile;
    }

    // Fetch emails from auth via edge function
    let emailMap: Record<string, { email: string | null }> = {};
    try {
      const { data } = await supabase.functions.invoke("get-users-info", {
        body: { userIds },
      });
      if (data?.users) emailMap = data.users;
    } catch (e) {
      console.error("Failed to fetch emails:", e);
    }

    const list: RoleUser[] = roles.map((role) => ({
      user_id: role.user_id,
      role: role.role,
      profile: profileMap[role.user_id] || undefined,
      email: emailMap[role.user_id]?.email || null,
    }));

    setAdmins(list.filter((u) => u.role === "admin"));
    setMerchants(list.filter((u) => u.role === "merchant"));
    setIsLoading(false);
  };

  const removeRole = async (userId: string, role: string) => {
    if (!confirm(`Remove ${role} access for this user?`)) return;
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role as any);
      if (error) throw error;
      toast({ title: `${role} access removed` });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const UserList = ({ users, role }: { users: RoleUser[]; role: string }) => (
    users.length === 0 ? (
      <div className="text-center py-12">
        <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No {role}s found</p>
      </div>
    ) : (
      <div className="space-y-3">
        {users.map((u) => (
          <UserCard key={u.user_id} user={u} onRemove={(id) => removeRole(id, role)} roleName={role} />
        ))}
      </div>
    )
  );

  return (
    <AdminLayout title="Manage Users" headerActions={
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setAdminDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-1" /> Add Admin
        </Button>
        <Button size="sm" variant="outline" className="border-amber-600 text-amber-200 hover:bg-amber-800" onClick={() => setMerchantDialogOpen(true)}>
          <Store className="w-4 h-4 mr-1" /> Add Merchant
        </Button>
      </div>
    }>
      <AddUserDialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen} roleName="admin" onAdded={fetchUsers} />
      <AddUserDialog open={merchantDialogOpen} onOpenChange={setMerchantDialogOpen} roleName="merchant" onAdded={fetchUsers} />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <Tabs defaultValue="admins" className="w-full">
          <TabsList className="bg-amber-900 border border-amber-800">
            <TabsTrigger value="admins" className="data-[state=active]:bg-primary">Admins ({admins.length})</TabsTrigger>
            <TabsTrigger value="merchants" className="data-[state=active]:bg-amber-600">Merchants ({merchants.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="admins" className="mt-4">
            <UserList users={admins} role="admin" />
          </TabsContent>
          <TabsContent value="merchants" className="mt-4">
            <UserList users={merchants} role="merchant" />
          </TabsContent>
        </Tabs>
      )}
    </AdminLayout>
  );
};
