import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Gamepad2, Wallet, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, games: 0, revenue: 0, alerts: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      const [{ count: users }, { count: alerts }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("fraud_alerts").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      const { data: txns } = await supabase.from("transactions").select("amount, created_at").eq("type", "deposit").eq("status", "completed");
      const revenue = txns?.reduce((s, t) => s + Math.abs(t.amount), 0) || 0;
      const { data: games } = await supabase.from("game_configs").select("*").eq("is_active", true);
      setStats({ users: users || 0, games: games?.length || 0, revenue, alerts: alerts || 0 });

      // Build revenue chart from actual transactions
      if (txns && txns.length > 0) {
        const byDay: Record<string, number> = {};
        txns.forEach(t => {
          const day = new Date(t.created_at).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          byDay[day] = (byDay[day] || 0) + Math.abs(t.amount);
        });
        setRevenueData(Object.entries(byDay).slice(-7).map(([name, revenue]) => ({ name, revenue })));
      }
    };
    loadStats();
  }, []);

  const statCards = [
    { title: "Total Users", value: stats.users.toLocaleString(), icon: Users, color: "text-primary" },
    { title: "Active Games", value: String(stats.games), icon: Gamepad2, color: "text-neon-blue" },
    { title: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: Wallet, color: "text-neon-green" },
    { title: "Fraud Alerts", value: String(stats.alerts), icon: ShieldAlert, color: "text-neon-red" },
  ];

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">Admin <span className="text-primary text-glow">Dashboard</span></h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="gradient-card border-border/50">
              <CardContent className="pt-6">
                <s.icon className={`h-8 w-8 ${s.color} mb-2`} />
                <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.title}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="gradient-card border-border/50">
        <CardHeader><CardTitle className="font-display text-lg">Revenue (Live Data)</CardTitle></CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                <XAxis dataKey="name" stroke="hsl(220 10% 55%)" fontSize={12} />
                <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 18%)", borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="hsl(145 80% 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">No deposit revenue yet. Chart will appear once payments are processed.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
