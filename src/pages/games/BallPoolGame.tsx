import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Circle, Clock, History } from "lucide-react";

const BALLS = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  multiplier: [1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8, 10][i],
  color: ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#a855f7"][i],
}));

import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";

const BallPoolGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("ball_pool");
  const { user, wallet, refreshWallet } = useAuth();
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [selectedBall, setSelectedBall] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);

  const fetchRound = useCallback(async () => {
    // Check for closed round waiting for result
    const { data: closedRound } = await supabase
      .from("ball_pool_rounds")
      .select("*")
      .eq("status", "closed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (closedRound) {
      setCurrentRound(closedRound);
      return;
    }

    const { data } = await supabase
      .from("ball_pool_rounds")
      .select("*")
      .eq("status", "betting")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setCurrentRound(data);
    } else {
      const { data: newRound } = await supabase
        .from("ball_pool_rounds")
        .insert({
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 45000).toISOString(),
        })
        .select()
        .single();
      setCurrentRound(newRound);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from("ball_pool_rounds")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  }, []);

  const fetchMyBets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ball_pool_bets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setMyBets(data || []);
  }, [user]);

  useEffect(() => {
    fetchRound();
    fetchHistory();
    if (user) fetchMyBets();
    const interval = setInterval(() => {
      fetchRound();
      fetchHistory();
      if (user) fetchMyBets();
      refreshWallet();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchRound, fetchHistory, fetchMyBets, user]);

  useEffect(() => {
    if (!currentRound?.ends_at) return;
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(currentRound.ends_at).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0 && currentRound.status === "betting") {
        closeRound();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentRound]);

  const closeRound = async () => {
    if (!currentRound || currentRound.status !== "betting") return;
    await supabase
      .from("ball_pool_rounds")
      .update({ status: "closed" })
      .eq("id", currentRound.id)
      .eq("status", "betting");
    setCurrentRound((prev: any) => prev ? { ...prev, status: "closed" } : prev);
  };

  const placeBet = async () => {
    if (!user) return toast.error("Please sign in");
    if (selectedBall === null) return toast.error("Select a ball");
    const amount = parseInt(betAmount);
    if (!amount || amount < 10) return toast.error("Min ₹10");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");
    if (!currentRound || currentRound.status !== "betting" || timeLeft <= 0) return toast.error("Round ended");

    setPlacing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - amount }).eq("user_id", user.id);
      await supabase.from("ball_pool_bets").insert({ user_id: user.id, round_id: currentRound.id, selected_ball: selectedBall, amount });
      await supabase.from("transactions").insert({ user_id: user.id, type: "game_entry", amount: -amount, status: "completed", description: `Ball Pool - Ball #${selectedBall}` });
      toast.success(`Bet ₹${amount} on Ball #${selectedBall}`);
      setSelectedBall(null);
      setBetAmount("");
      refreshWallet();
      fetchMyBets();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPlacing(false);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Ball Pool Guess" />;

  const isWaitingResult = currentRound?.status === "closed";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">
          <Circle className="inline h-8 w-8 text-neon-blue mr-2" />
          Ball Pool <span className="text-neon-blue">Guess</span>
        </h1>

        <Card className="gradient-card border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center justify-between">
              <span className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Round #{currentRound?.round_number || "..."}</span>
              {isWaitingResult ? (
                <span className="text-lg text-neon-orange animate-pulse-glow font-display">Waiting for Result...</span>
              ) : (
                <span className={`text-3xl ${timeLeft <= 10 ? "text-neon-red animate-pulse-glow" : "text-primary"}`}>{timeLeft}s</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isWaitingResult && (
              <div className="text-center mb-6 py-4">
                <p className="text-muted-foreground">The winning ball will be revealed shortly</p>
              </div>
            )}

            <div className="grid grid-cols-5 gap-3 mb-6">
              {BALLS.map(ball => (
                <button
                  key={ball.number}
                  onClick={() => !isWaitingResult && setSelectedBall(ball.number)}
                  disabled={isWaitingResult}
                  className={`h-16 rounded-xl flex flex-col items-center justify-center transition-all ${selectedBall === ball.number ? "ring-4 ring-foreground scale-110" : "opacity-70 hover:opacity-100"} ${isWaitingResult ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ background: ball.color }}
                >
                  <span className="font-display font-bold text-foreground drop-shadow-lg">#{ball.number}</span>
                  <span className="text-xs text-foreground/80">{ball.multiplier}x</span>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <Input type="number" placeholder="Amount (min ₹10)" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="bg-secondary border-border" min={10} disabled={isWaitingResult} />
              <Button onClick={placeBet} disabled={placing || timeLeft <= 0 || isWaitingResult} className="gradient-primary text-primary-foreground font-display whitespace-nowrap">
                Place Bet
              </Button>
            </div>
            {wallet && <p className="text-xs text-muted-foreground mt-2">Balance: ₹{wallet.balance}</p>}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="gradient-card border-border/50">
            <CardHeader><CardTitle className="font-display text-sm">Recent Results</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {history.map(r => (
                  <div key={r.id} className="h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold text-foreground" style={{ background: r.winning_ball ? BALLS[r.winning_ball - 1].color : "#666" }}>
                    #{r.winning_ball}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardHeader><CardTitle className="font-display text-sm">My Bets</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {myBets.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-sm py-1 border-b border-border/30">
                    <span>Ball #{b.selected_ball}</span>
                    <span className="text-muted-foreground">₹{b.amount}</span>
                    <span className={b.status === "won" ? "text-primary" : b.status === "lost" ? "text-neon-red" : "text-muted-foreground"}>
                      {b.status === "won" ? `+₹${b.payout}` : b.status === "lost" ? "Lost" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BallPoolGame;
