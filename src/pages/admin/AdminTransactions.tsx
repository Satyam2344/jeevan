import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminTransactions = () => {
  const [txns, setTxns] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => { fetchTxns(); }, []);

  const fetchTxns = async () => {
    const { data: txData } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (!txData) { setTxns([]); return; }

    // Get unique user_ids and fetch profiles
    const userIds = [...new Set(txData.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, email")
      .in("user_id", userIds);
    
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    setTxns(txData.map(t => ({ ...t, profile: profileMap.get(t.user_id) || null })));
  };

  const updateStatus = async (id: string, status: string, tx: any) => {
    await supabase.from("transactions").update({ status }).eq("id", id);
    
    // If approving a withdrawal, deduct from wallet
    if (status === "completed" && tx.type === "withdrawal") {
      await supabase.rpc("has_role", { _user_id: tx.user_id, _role: "user" }); // just a check
      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", tx.user_id).single();
      if (wallet) {
        await supabase.from("wallets").update({
          balance: (wallet.balance || 0) - Math.abs(tx.amount),
          total_withdrawn: (wallet.total_withdrawn || 0) + Math.abs(tx.amount),
        }).eq("user_id", tx.user_id);
      }
    }
    
    toast.success(`Transaction ${status}`);
    fetchTxns();
  };

  const filtered = txns.filter(t => {
    const profile = t.profile;
    return (profile?.username || "").toLowerCase().includes(search.toLowerCase()) ||
           (profile?.email || "").toLowerCase().includes(search.toLowerCase()) ||
           t.id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">Payment <span className="text-primary text-glow">Transactions</span></h1>
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Badge variant="secondary" className="text-muted-foreground">{filtered.length} transactions</Badge>
      </div>

      <Card className="gradient-card border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">User</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Amount</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Method</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Date</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Status</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                    <td className="p-4 text-foreground">{tx.profile?.username || tx.profile?.email || "N/A"}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 capitalize">
                        {tx.type === "deposit" ? <ArrowDownLeft className="h-3 w-3 text-primary" /> : <ArrowUpRight className="h-3 w-3 text-neon-orange" />}
                        {tx.type.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 font-display text-foreground">₹{Math.abs(tx.amount)}</td>
                    <td className="p-4 text-muted-foreground">{tx.payment_method || "—"}</td>
                    <td className="p-4 text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <Badge variant="secondary" className={`text-xs ${tx.status === "completed" ? "text-primary" : tx.status === "failed" ? "text-neon-red" : "text-neon-orange"}`}>
                        {tx.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      {(tx.status === "processing" || tx.status === "pending") && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" className="text-primary text-xs" onClick={() => updateStatus(tx.id, "completed", tx)}>Approve</Button>
                          <Button size="sm" variant="ghost" className="text-neon-red text-xs" onClick={() => updateStatus(tx.id, "failed", tx)}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No transactions yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactions;
