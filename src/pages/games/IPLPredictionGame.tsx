import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Medal } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const IPL_TEAMS = ["CSK", "MI", "RCB", "KKR", "DC", "SRH", "RR", "PBKS", "GT", "LSG"];

import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";

const IPLPredictionGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("ipl_prediction");
  const { user, wallet, refreshWallet } = useAuth();
  const [predictionType, setPredictionType] = useState("winner");
  const [predictionValue, setPredictionValue] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [myPredictions, setMyPredictions] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (user) fetchMyPredictions();
  }, [user]);

  const fetchMyPredictions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ipl_predictions")
      .select("*")
      .eq("user_id", user.id)
      .eq("season", "2026")
      .order("created_at", { ascending: false });
    setMyPredictions(data || []);
  };

  const placePrediction = async () => {
    if (!user) return toast.error("Please sign in");
    if (!predictionValue) return toast.error("Enter your prediction");
    const amount = parseInt(betAmount);
    if (!amount || amount < 100) return toast.error("Min ₹100");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");

    setPlacing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - amount }).eq("user_id", user.id);
      await supabase.from("ipl_predictions").insert({
        user_id: user.id,
        season: "2026",
        prediction_type: predictionType,
        prediction_value: predictionValue,
        amount,
      });
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "game_entry",
        amount: -amount,
        status: "completed",
        description: `IPL 2026 - ${predictionType} prediction`,
      });
      toast.success("IPL prediction placed!");
      setPredictionValue("");
      setBetAmount("");
      refreshWallet();
      fetchMyPredictions();
    } catch (err: any) {
      toast.error("Already predicted this category for this season");
    } finally {
      setPlacing(false);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="IPL Prediction" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-3xl">
        <h1 className="text-4xl font-display font-bold mb-8">
          <Medal className="inline h-8 w-8 text-neon-purple mr-2" />
          IPL 2026 <span className="text-neon-purple">Prediction</span>
        </h1>

        <Card className="gradient-card border-neon-purple/30 mb-8">
          <CardHeader>
            <CardTitle className="font-display">Make Your Prediction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={predictionType} onValueChange={setPredictionType}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="winner">IPL Winner Team</SelectItem>
                <SelectItem value="top_batsman">Top Batsman</SelectItem>
                <SelectItem value="top_bowler">Top Bowler</SelectItem>
                <SelectItem value="final_prediction">Final Match Prediction</SelectItem>
              </SelectContent>
            </Select>

            {predictionType === "winner" ? (
              <Select value={predictionValue} onValueChange={setPredictionValue}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select team" />
                </SelectTrigger>
                <SelectContent>
                  {IPL_TEAMS.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input placeholder={predictionType === "final_prediction" ? "e.g., CSK vs MI" : "Player name"} value={predictionValue} onChange={e => setPredictionValue(e.target.value)} className="bg-secondary border-border" />
            )}

            <Input type="number" placeholder="Amount (min ₹100)" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="bg-secondary border-border" min={100} />
            <Button onClick={placePrediction} disabled={placing} className="w-full gradient-accent text-accent-foreground font-display">
              Submit Prediction
            </Button>
            {wallet && <p className="text-xs text-muted-foreground">Balance: ₹{wallet.balance}</p>}
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader><CardTitle className="font-display text-lg">My IPL 2026 Predictions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myPredictions.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{p.prediction_type.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{p.prediction_value}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-display text-foreground">₹{p.amount}</p>
                    <Badge variant="secondary" className={`text-xs ${p.status === "won" ? "text-primary" : p.status === "lost" ? "text-neon-red" : "text-neon-purple"}`}>
                      {p.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {myPredictions.length === 0 && <p className="text-sm text-muted-foreground">No predictions yet. Be the first!</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default IPLPredictionGame;
