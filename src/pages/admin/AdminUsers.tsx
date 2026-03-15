import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ROLES = ["user", "moderator", "admin"] as const;

const AdminUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!profiles) { setUsers([]); return; }

    const userIds = profiles.map(p => p.user_id);
    const [{ data: wallets }, { data: roles }] = await Promise.all([
      supabase.from("wallets").select("user_id, balance").in("user_id", userIds),
      supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
    ]);

    const walletMap = new Map((wallets || []).map(w => [w.user_id, w]));
    const roleMap = new Map((roles || []).map(r => [r.user_id, r]));

    setUsers(profiles.map(p => ({
      ...p,
      wallet_balance: walletMap.get(p.user_id)?.balance || 0,
      user_role: roleMap.get(p.user_id)?.role || "user",
    })));
  };

  const toggleActive = async (userId: string, currentActive: boolean) => {
    await supabase.from("profiles").update({ is_active: !currentActive }).eq("user_id", userId);
    toast.success(currentActive ? "User suspended" : "User activated");
    fetchUsers();
  };

  const startEditRole = (userId: string, currentRole: string) => {
    setEditingRole(userId);
    setSelectedRole(currentRole);
  };

  const saveRole = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: selectedRole as any })
      .eq("user_id", userId);
    
    if (error) {
      toast.error("Failed to update role");
    } else {
      toast.success(`Role updated to ${selectedRole}`);
      fetchUsers();
    }
    setEditingRole(null);
  };

  const filtered = users.filter(u =>
    (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">User <span className="text-primary text-glow">Management</span></h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Badge variant="secondary" className="text-muted-foreground">{filtered.length} users</Badge>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">User</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Balance</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Role</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                    <td className="p-4">
                      <p className="font-medium text-foreground">{user.username || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="p-4 font-display text-foreground">₹{user.wallet_balance || 0}</td>
                    <td className="p-4">
                      {editingRole === user.user_id ? (
                        <div className="flex items-center gap-2">
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger className="w-28 h-8 text-xs bg-secondary border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => (
                                <SelectItem key={r} value={r} className="text-xs capitalize">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary hover:text-primary" onClick={() => saveRole(user.user_id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => setEditingRole(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={`text-xs capitalize ${user.user_role === "admin" ? "text-primary" : ""}`}>
                            {user.user_role}
                          </Badge>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => startEditRole(user.user_id, user.user_role)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className={`text-xs ${user.is_active ? "text-primary" : "text-neon-red"}`}>
                        {user.is_active ? "Active" : "Suspended"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => toggleActive(user.user_id, user.is_active)}
                        className={user.is_active ? "text-neon-red hover:text-neon-red" : "text-primary hover:text-primary"}>
                        {user.is_active ? "Suspend" : "Activate"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
