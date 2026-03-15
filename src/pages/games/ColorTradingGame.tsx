import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Palette, Clock, History } from "lucide-react";

const COLORS = [
  { name: "red", label: "Red", class: "bg-neon-red", multiplier: 3 },
  { name: "green", label: "Green", class: "bg-neon-green", multiplier: 3 },
  { name: "blue", label: "Blue", class: "bg-neon-blue", multiplier: 3 },
];

import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";

const ColorTradingGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("color_trading");
  const { user, wallet, refreshWallet } = useAuth();
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [betAmount, setBetAmount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [myBets, setMyBets] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);

  const fetchCurrentRound = useCallback(async () => {
    // First check for a round waiting for result
    const { data: closedRound } = await supabase
      .from("color_trading_rounds")
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
      .from("color_trading_rounds")
      .select("*")
      .eq("status", "betting")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setCurrentRound(data);
    } else {
      // Create a new round
      const { data: newRound } = await supabase
        .from("color_trading_rounds")
        .insert({
          starts_at: new Date().toISOString(),
          ends_at: new Date(Date.now() + 60000).toISOString(),
        })
        .select()
        .single();
      setCurrentRound(newRound);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from("color_trading_rounds")
      .select("*")
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);
    setHistory(data || []);
  }, []);

  const fetchMyBets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("color_trading_bets")
      .select("*, color_trading_rounds(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setMyBets(data || []);
  }, [user]);

  useEffect(() => {
    fetchCurrentRound();
    fetchHistory();
    if (user) fetchMyBets();

    const interval = setInterval(() => {
      fetchCurrentRound();
      fetchHistory();
      if (user) fetchMyBets();
      refreshWallet();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchCurrentRound, fetchHistory, fetchMyBets, user]);

  useEffect(() => {
    if (!currentRound?.ends_at) return;
    const timer = setInterval(() => {
      const diff = Math.max(0, Math.floor((new Date(currentRound.ends_at).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0 && currentRound.status === "betting") {
        // Close the round - result will be set shortly
        closeRound();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentRound]);

  const closeRound = async () => {
    if (!currentRound || currentRound.status !== "betting") return;
    await supabase
      .from("color_trading_rounds")
      .update({ status: "closed" })
      .eq("id", currentRound.id)
      .eq("status", "betting");
    setCurrentRound((prev: any) => prev ? { ...prev, status: "closed" } : prev);
  };

  const placeBet = async () => {
    if (!user) return toast.error("Please sign in to play");
    if (!selectedColor) return toast.error("Select a color");
    const amount = parseInt(betAmount);
    if (!amount || amount < 10) return toast.error("Minimum bet is ₹10");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");
    if (!currentRound || currentRound.status !== "betting" || timeLeft <= 0) return toast.error("Round has ended");

    setPlacing(true);
    try {
      await supabase
        .from("wallets")
        .update({ balance: (wallet?.balance || 0) - amount })
        .eq("user_id", user.id);

      await supabase.from("color_trading_bets").insert({
        user_id: user.id,
        round_id: currentRound.id,
        predicted_color: selectedColor,
        amount,
      });

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "game_entry",
        amount: -amount,
        status: "completed",
        description: `Color Trading - Bet on ${selectedColor}`,
      });

      toast.success(`Bet placed! ₹${amount} on ${selectedColor}`);
      setSelectedColor("");
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
  if (isActive === false) return <GameDisabled title="Color Trading" />;

  const isWaitingResult = currentRound?.status === "closed";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">
          <Palette className="inline h-8 w-8 text-neon-orange mr-2" />
          Color <span className="text-neon-orange">Trading</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Round #{currentRound?.round_number || "..."}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                {isWaitingResult ? (
                  <div>
                    <div className="text-2xl font-display font-bold text-neon-orange animate-pulse-glow">
                      Waiting for Result...
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">The winning color will be revealed shortly</p>
                  </div>
                ) : (
                  <>
                    <div className={`text-6xl font-display font-bold ${timeLeft <= 10 ? "text-neon-red animate-pulse-glow" : "text-primary text-glow"}`}>
                      {timeLeft}s
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {timeLeft > 0 ? "Place your bet now!" : "Round ending..."}
                    </p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => !isWaitingResult && setSelectedColor(c.name)}
                    disabled={isWaitingResult}
                    className={`h-20 rounded-xl ${c.class} transition-all ${selectedColor === c.name ? "ring-4 ring-foreground scale-105" : "opacity-70 hover:opacity-100"} ${isWaitingResult ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span className="font-display font-bold text-foreground drop-shadow-lg">{c.label}</span>
                    <span className="block text-xs text-foreground/80">{c.multiplier}x</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Input
                  type="number"
                  placeholder="Amount (min ₹10)"
                  value={betAmount}
                  onChange={e => setBetAmount(e.target.value)}
                  className="bg-secondary border-border"
                  min={10}
                  disabled={isWaitingResult}
                />
                <Button
                  onClick={placeBet}
                  disabled={placing || timeLeft <= 0 || isWaitingResult}
                  className="gradient-primary text-primary-foreground font-display whitespace-nowrap"
                >
                  Place Bet
                </Button>
              </div>
              {wallet && (
                <p className="text-xs text-muted-foreground mt-2">Balance: ₹{wallet.balance}</p>
              )}
            </CardContent>
          </Card>

          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <History className="h-5 w-5" /> Recent Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {history.map(r => (
                  <div
                    key={r.id}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold text-foreground ${
                      r.result_color === "red" ? "bg-neon-red" : r.result_color === "green" ? "bg-neon-green" : "bg-neon-blue"
                    }`}
                  >
                    #{r.round_number}
                  </div>
                ))}
                {history.length === 0 && <p className="text-sm text-muted-foreground">No rounds completed yet</p>}
              </div>

              <h3 className="font-display text-sm font-semibold mb-2 text-foreground">My Bets</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {myBets.map(b => (
                  <div key={b.id} className="flex items-center justify-between text-sm py-1 border-b border-border/30">
                    <span className={`capitalize ${b.predicted_color === "red" ? "text-neon-red" : b.predicted_color === "green" ? "text-neon-green" : "text-neon-blue"}`}>
                      {b.predicted_color}
                    </span>
                    <span className="text-muted-foreground">₹{b.amount}</span>
                    <span className={b.status === "won" ? "text-primary" : b.status === "lost" ? "text-neon-red" : "text-muted-foreground"}>
                      {b.status === "won" ? `+₹${b.payout}` : b.status === "lost" ? "Lost" : "Pending"}
                    </span>
                  </div>
                ))}
                {myBets.length === 0 && <p className="text-xs text-muted-foreground">No bets yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ColorTradingGame;
