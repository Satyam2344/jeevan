import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, ArrowUpRight, ArrowDownLeft, Gift, Plus, CreditCard, History } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const WalletPage = () => {
  const { user, wallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setTransactions(data || []);
  };

  const handleDeposit = async () => {
    const amount = parseInt(depositAmount);
    if (!amount || amount < 100) return toast.error("Minimum deposit ₹100");
    if (!user) return;

    setDepositing(true);
    try {
      // Create Razorpay order via edge function
      const { data, error } = await supabase.functions.invoke("razorpay-order", {
        body: { amount, user_id: user.id },
      });

      if (error) throw error;

      // Open Razorpay checkout
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: "INR",
        name: "AsifPlay",
        description: "Wallet Deposit",
        order_id: data.order_id,
        handler: async (response: any) => {
          // Verify payment
          const { error: verifyError } = await supabase.functions.invoke("razorpay-verify", {
            body: {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              user_id: user.id,
              amount,
            },
          });

          if (verifyError) {
            toast.error("Payment verification failed");
          } else {
            toast.success(`₹${amount} deposited successfully!`);
            refreshWallet();
            fetchTransactions();
          }
        },
        prefill: { email: user.email },
        theme: { color: "#22c55e" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to create order");
    } finally {
      setDepositing(false);
      setDepositAmount("");
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount);
    if (!amount || amount < 100) return toast.error("Minimum withdrawal ₹100");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");
    if (!user) return;

    setWithdrawing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - amount }).eq("user_id", user.id);
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        amount: -amount,
        status: "processing",
        payment_method: "Bank Transfer",
        description: "Wallet withdrawal",
      });
      toast.success("Withdrawal request submitted! Processing in 24-48 hours.");
      refreshWallet();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setWithdrawing(false);
      setWithdrawAmount("");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "deposit": return ArrowDownLeft;
      case "withdrawal": return ArrowUpRight;
      case "game_win": case "bonus": case "referral_bonus": return Gift;
      default: return History;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8">
          My <span className="text-primary text-glow">Wallet</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="gradient-card border-primary/30 box-glow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-body">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-primary" />
                  <span className="text-3xl font-display font-bold text-primary text-glow">₹{wallet?.balance || 0}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="gradient-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-body">Total Winnings</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-display font-bold text-neon-green">₹{wallet?.total_winnings || 0}</span>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="gradient-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-body">Bonus Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-3xl font-display font-bold text-neon-purple">₹{wallet?.bonus_balance || 0}</span>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="flex gap-4 mb-10">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground font-display">
                <Plus className="h-4 w-4 mr-2" /> Add Funds
              </Button>
            </DialogTrigger>
            <DialogContent className="gradient-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Deposit Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input type="number" placeholder="Amount (min ₹100)" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="bg-secondary border-border" min={100} />
                <div className="flex gap-2">
                  {[100, 500, 1000, 5000].map(a => (
                    <Button key={a} size="sm" variant="outline" className="border-border text-muted-foreground hover:text-primary hover:border-primary/50" onClick={() => setDepositAmount(String(a))}>
                      ₹{a}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleDeposit} disabled={depositing} className="w-full gradient-primary text-primary-foreground font-display">
                  {depositing ? "Processing..." : "Pay with Razorpay"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-display">
                <CreditCard className="h-4 w-4 mr-2" /> Withdraw
              </Button>
            </DialogTrigger>
            <DialogContent className="gradient-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Withdraw Funds</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Available: ₹{wallet?.balance || 0}</p>
                <Input type="number" placeholder="Amount (min ₹100)" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} className="bg-secondary border-border" min={100} />
                <Button onClick={handleWithdraw} disabled={withdrawing} className="w-full gradient-primary text-primary-foreground font-display">
                  {withdrawing ? "Processing..." : "Request Withdrawal"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map(tx => {
                const Icon = getIcon(tx.type);
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">{tx.type.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{tx.description || ""} • {new Date(tx.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-display font-bold ${tx.amount > 0 ? "text-primary" : "text-neon-red"}`}>
                        {tx.amount > 0 ? "+" : ""}₹{Math.abs(tx.amount)}
                      </p>
                      <p className={`text-xs ${tx.status === "processing" ? "text-neon-orange" : tx.status === "failed" ? "text-neon-red" : "text-muted-foreground"}`}>
                        {tx.status}
                      </p>
                    </div>
                  </div>
                );
              })}
              {transactions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default WalletPage;
