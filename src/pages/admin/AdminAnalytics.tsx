import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ["hsl(0 80% 55%)", "hsl(25 95% 55%)", "hsl(210 90% 55%)", "hsl(45 90% 55%)", "hsl(270 70% 60%)"];

const AdminAnalytics = () => {
  const [gameData, setGameData] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, active: 0, suspended: 0 });

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    // Game bet counts
    const [colorBets, ballBets, matchPreds, iplPreds] = await Promise.all([
      supabase.from("color_trading_bets").select("*", { count: "exact", head: true }),
      supabase.from("ball_pool_bets").select("*", { count: "exact", head: true }),
      supabase.from("match_predictions").select("*", { count: "exact", head: true }),
      supabase.from("ipl_predictions").select("*", { count: "exact", head: true }),
    ]);

    const gd = [
      { name: "Color Trading", value: colorBets.count || 0 },
      { name: "Ball Pool", value: ballBets.count || 0 },
      { name: "MOTM", value: matchPreds.count || 0 },
      { name: "IPL", value: iplPreds.count || 0 },
    ].filter(g => g.value > 0);

    setGameData(gd.length > 0 ? gd : [{ name: "No bets yet", value: 1 }]);

    // Revenue by recent transactions
    const { data: txns } = await supabase
      .from("transactions")
      .select("amount, created_at, type")
      .eq("type", "deposit")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(500);

    if (txns && txns.length > 0) {
      const byDay: Record<string, number> = {};
      txns.forEach(t => {
        const day = new Date(t.created_at).toLocaleDateString("en-US", { weekday: "short" });
        byDay[day] = (byDay[day] || 0) + Math.abs(t.amount);
      });
      setRevenueByDay(Object.entries(byDay).map(([name, revenue]) => ({ name, revenue })));
    }

    // User stats
    const [{ count: total }, { count: active }] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);
    setUserStats({
      total: total || 0,
      active: active || 0,
      suspended: (total || 0) - (active || 0),
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">
        Analytics & <span className="text-accent text-glow-purple">Reports</span>
      </h1>

      {/* User stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", val: userStats.total, color: "text-primary" },
          { label: "Active Users", val: userStats.active, color: "text-neon-green" },
          { label: "Suspended", val: userStats.suspended, color: "text-neon-red" },
        ].map(s => (
          <Card key={s.label} className="gradient-card border-border/50">
            <CardContent className="pt-6">
              <p className={`text-2xl font-display font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Bets by Game (Live Data)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={gameData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {gameData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 18%)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Deposit Revenue (Live Data)</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
                  <XAxis dataKey="name" stroke="hsl(220 10% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(220 18% 10%)", border: "1px solid hsl(220 15% 18%)", borderRadius: 8 }} />
                  <Bar dataKey="revenue" fill="hsl(145 80% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-16">No deposit data yet. Revenue chart will appear once deposits are made.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
