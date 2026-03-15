import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Circle, Spade, Medal, Trophy, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BALLS = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  color: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#a855f7"][i],
  multiplier: [1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10][i],
}));

const AdminGameResults = () => {
  const [colorRounds, setColorRounds] = useState<any[]>([]);
  const [ballRounds, setBallRounds] = useState<any[]>([]);
  const [rummyTables, setRummyTables] = useState<any[]>([]);
  const [iplPredictions, setIplPredictions] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchColorRounds();
    fetchBallRounds();
    fetchRummyTables();
    fetchIPLPredictions();
  };

  const fetchColorRounds = async () => {
    const { data } = await supabase
      .from("color_trading_rounds")
      .select("*")
      .in("status", ["closed", "betting"])
      .order("created_at", { ascending: false })
      .limit(20);
    setColorRounds(data || []);
  };

  const fetchBallRounds = async () => {
    const { data } = await supabase
      .from("ball_pool_rounds")
      .select("*")
      .in("status", ["closed", "betting"])
      .order("created_at", { ascending: false })
      .limit(20);
    setBallRounds(data || []);
  };

  const fetchRummyTables = async () => {
    const { data } = await supabase
      .from("rummy_tables")
      .select("*, rummy_players(*)")
      .in("status", ["playing", "waiting"])
      .order("created_at", { ascending: false });
    setRummyTables(data || []);
  };

  const fetchIPLPredictions = async () => {
    const { data } = await supabase
      .from("ipl_predictions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(50);
    setIplPredictions(data || []);
  };

  // ===== COLOR TRADING =====
  const setColorResult = async (roundId: string, color: string) => {
    // Set result
    await supabase
      .from("color_trading_rounds")
      .update({ result_color: color, status: "completed" })
      .eq("id", roundId);

    // Process all bets for this round
    const { data: bets } = await supabase
      .from("color_trading_bets")
      .select("*")
      .eq("round_id", roundId)
      .eq("status", "pending");

    for (const bet of bets || []) {
      const won = bet.predicted_color === color;
      const payout = won ? bet.amount * 3 : 0;
      await supabase
        .from("color_trading_bets")
        .update({ status: won ? "won" : "lost", payout })
        .eq("id", bet.id);

      if (won) {
        // Credit winner
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", bet.user_id)
          .single();
        await supabase
          .from("wallets")
          .update({ balance: (wallet?.balance || 0) + payout })
          .eq("user_id", bet.user_id);
        await supabase.from("transactions").insert({
          user_id: bet.user_id,
          type: "game_win",
          amount: payout,
          status: "completed",
          description: `Color Trading - Won on ${color}`,
        });
      }
    }

    toast.success(`Round result set: ${color}. All bets processed!`);
    fetchColorRounds();
  };

  // ===== BALL POOL =====
  const setBallResult = async (roundId: string, ball: number) => {
    const mult = BALLS[ball - 1].multiplier;
    await supabase
      .from("ball_pool_rounds")
      .update({ winning_ball: ball, multiplier: mult, status: "completed" })
      .eq("id", roundId);

    const { data: bets } = await supabase
      .from("ball_pool_bets")
      .select("*")
      .eq("round_id", roundId)
      .eq("status", "pending");

    for (const bet of bets || []) {
      const won = bet.selected_ball === ball;
      const payout = won ? Math.floor(bet.amount * mult) : 0;
      await supabase.from("ball_pool_bets").update({ status: won ? "won" : "lost", payout }).eq("id", bet.id);

      if (won) {
        const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", bet.user_id).single();
        await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", bet.user_id);
        await supabase.from("transactions").insert({
          user_id: bet.user_id, type: "game_win", amount: payout, status: "completed",
          description: `Ball Pool - Won on Ball #${ball}`,
        });
      }
    }

    toast.success(`Ball #${ball} set as winner. All bets processed!`);
    fetchBallRounds();
  };

  // ===== RUMMY =====
  const setRummyWinner = async (tableId: string, winnerId: string, prizePool: number) => {
    const commission = Math.floor(prizePool * 0.05);
    const winAmount = prizePool - commission;

    await supabase.from("rummy_tables").update({ winner_id: winnerId, status: "completed" }).eq("id", tableId);
    await supabase.from("rummy_players").update({ status: "eliminated" }).eq("table_id", tableId).neq("user_id", winnerId);
    await supabase.from("rummy_players").update({ status: "won" }).eq("table_id", tableId).eq("user_id", winnerId);

    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", winnerId).single();
    await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + winAmount }).eq("user_id", winnerId);
    await supabase.from("transactions").insert({
      user_id: winnerId, type: "game_win", amount: winAmount, status: "completed",
      description: `Rummy - Won ₹${winAmount}`,
    });

    toast.success(`Winner set! ₹${winAmount} credited (₹${commission} commission).`);
    fetchRummyTables();
  };

  // ===== IPL =====
  const resolveIPLPrediction = async (id: string, status: "won" | "lost", amount: number, userId: string) => {
    const payout = status === "won" ? amount * 5 : 0;
    await supabase.from("ipl_predictions").update({ status, payout }).eq("id", id);

    if (status === "won") {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", userId).single();
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) + payout }).eq("user_id", userId);
      await supabase.from("transactions").insert({
        user_id: userId, type: "game_win", amount: payout, status: "completed",
        description: `IPL Prediction - Won ₹${payout}`,
      });
    }

    toast.success(`Prediction marked as ${status}`);
    fetchIPLPredictions();
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">
        <Crown className="inline h-7 w-7 text-primary mr-2" />
        Game <span className="text-primary text-glow">Results Control</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Set winners for all games from here. Results are final and wallets are updated automatically.</p>

      <Tabs defaultValue="color" className="space-y-4">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="color" className="font-display text-xs"><Palette className="h-3 w-3 mr-1" /> Color Trading</TabsTrigger>
          <TabsTrigger value="ball" className="font-display text-xs"><Circle className="h-3 w-3 mr-1" /> Ball Pool</TabsTrigger>
          <TabsTrigger value="rummy" className="font-display text-xs"><Spade className="h-3 w-3 mr-1" /> Rummy</TabsTrigger>
          <TabsTrigger value="ipl" className="font-display text-xs"><Medal className="h-3 w-3 mr-1" /> IPL</TabsTrigger>
        </TabsList>

        {/* COLOR TRADING TAB */}
        <TabsContent value="color">
          <div className="space-y-3">
            {colorRounds.length === 0 && <p className="text-sm text-muted-foreground">No active rounds</p>}
            {colorRounds.map(r => (
              <Card key={r.id} className="gradient-card border-border/50">
                <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div>
                    <p className="font-display font-bold text-foreground">Round #{r.round_number}</p>
                    <Badge className={r.status === "closed" ? "bg-neon-orange/20 text-neon-orange" : "bg-primary/20 text-primary"}>
                      {r.status === "closed" ? "Awaiting Result" : "Betting Open"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {["red", "green", "blue"].map(color => (
                      <Button
                        key={color}
                        size="sm"
                        onClick={() => setColorResult(r.id, color)}
                        className={`capitalize font-display ${
                          color === "red" ? "bg-neon-red hover:bg-neon-red/80" :
                          color === "green" ? "bg-neon-green hover:bg-neon-green/80" :
                          "bg-neon-blue hover:bg-neon-blue/80"
                        } text-foreground`}
                      >
                        {color}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* BALL POOL TAB */}
        <TabsContent value="ball">
          <div className="space-y-3">
            {ballRounds.length === 0 && <p className="text-sm text-muted-foreground">No active rounds</p>}
            {ballRounds.map(r => (
              <Card key={r.id} className="gradient-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-display font-bold text-foreground">Round #{r.round_number}</p>
                      <Badge className={r.status === "closed" ? "bg-neon-orange/20 text-neon-orange" : "bg-primary/20 text-primary"}>
                        {r.status === "closed" ? "Awaiting Result" : "Betting Open"}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {BALLS.map(ball => (
                      <Button
                        key={ball.number}
                        size="sm"
                        onClick={() => setBallResult(r.id, ball.number)}
                        className="h-12 font-display font-bold text-foreground"
                        style={{ background: ball.color }}
                      >
                        #{ball.number}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* RUMMY TAB */}
        <TabsContent value="rummy">
          <div className="space-y-3">
            {rummyTables.length === 0 && <p className="text-sm text-muted-foreground">No active tables</p>}
            {rummyTables.map(t => {
              const players = (t.rummy_players as any[]) || [];
              return (
                <Card key={t.id} className="gradient-card border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-display font-bold text-foreground">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Prize: ₹{t.prize_pool} • {t.current_players}/{t.max_players} players
                        </p>
                      </div>
                      <Badge className={t.status === "playing" ? "bg-neon-red/20 text-neon-red" : "bg-primary/20 text-primary"}>
                        {t.status}
                      </Badge>
                    </div>
                    {t.status === "playing" && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-display">Select Winner:</p>
                        <div className="flex flex-wrap gap-2">
                          {players.map((p: any) => (
                            <Button
                              key={p.id}
                              size="sm"
                              variant="outline"
                              className="border-primary/40 text-primary hover:bg-primary/10 font-display text-xs"
                              onClick={() => setRummyWinner(t.id, p.user_id, t.prize_pool)}
                            >
                              <Trophy className="h-3 w-3 mr-1" />
                              {p.user_id.slice(0, 8)}...
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* IPL TAB */}
        <TabsContent value="ipl">
          <div className="space-y-3">
            {iplPredictions.length === 0 && <p className="text-sm text-muted-foreground">No pending predictions</p>}
            {iplPredictions.map(p => (
              <Card key={p.id} className="gradient-card border-border/50">
                <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                  <div>
                    <p className="font-display font-bold text-foreground capitalize">{p.prediction_type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      Prediction: {p.prediction_value} • Amount: ₹{p.amount}
                    </p>
                    <p className="text-xs text-muted-foreground">User: {p.user_id.slice(0, 8)}...</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gradient-primary text-primary-foreground font-display text-xs"
                      onClick={() => resolveIPLPrediction(p.id, "won", p.amount, p.user_id)}
                    >
                      ✓ Won
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive text-xs"
                      onClick={() => resolveIPLPrediction(p.id, "lost", p.amount, p.user_id)}
                    >
                      ✗ Lost
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminGameResults;
