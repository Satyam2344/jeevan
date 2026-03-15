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
import { Trophy, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";

const CricketPredictions = () => {
  const { isActive, loading: gameLoading } = useGameActive("motm");
  const { user, wallet, refreshWallet } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [predictionType, setPredictionType] = useState("winner");
  const [predictionValue, setPredictionValue] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [myPredictions, setMyPredictions] = useState<any[]>([]);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    fetchMatches();
    if (user) fetchMyPredictions();
  }, [user]);

  const fetchMatches = async () => {
    const { data } = await supabase
      .from("cricket_matches")
      .select("*")
      .in("status", ["upcoming", "live"])
      .order("match_date", { ascending: true });
    setMatches(data || []);
  };

  const fetchMyPredictions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("match_predictions")
      .select("*, cricket_matches(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyPredictions(data || []);
  };

  const placePrediction = async () => {
    if (!user) return toast.error("Please sign in");
    if (!selectedMatch) return toast.error("Select a match");
    if (!predictionValue) return toast.error("Enter your prediction");
    const amount = parseInt(betAmount);
    if (!amount || amount < 50) return toast.error("Min ₹50");
    if (amount > (wallet?.balance || 0)) return toast.error("Insufficient balance");

    setPlacing(true);
    try {
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - amount }).eq("user_id", user.id);
      await supabase.from("match_predictions").insert({
        user_id: user.id,
        match_id: selectedMatch.id,
        prediction_type: predictionType,
        prediction_value: predictionValue,
        amount,
      });
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "game_entry",
        amount: -amount,
        status: "completed",
        description: `Cricket - ${predictionType} prediction`,
      });
      toast.success("Prediction placed!");
      setPredictionValue("");
      setBetAmount("");
      refreshWallet();
      fetchMyPredictions();
    } catch (err: any) {
      toast.error(err.message || "Already predicted this category");
    } finally {
      setPlacing(false);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Man of the Match" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">
          <Trophy className="inline h-8 w-8 text-gold mr-2" />
          Cricket <span className="text-gold">Predictions</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Match list */}
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold text-foreground">Upcoming Matches</h2>
            {matches.length === 0 && <p className="text-sm text-muted-foreground">No upcoming matches available.</p>}
            {matches.map(m => (
              <Card
                key={m.id}
                className={`gradient-card cursor-pointer transition-all ${selectedMatch?.id === m.id ? "border-gold/50 box-glow" : "border-border/50 hover:border-gold/30"}`}
                onClick={() => setSelectedMatch(m)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-display font-bold text-foreground">{m.team_a} vs {m.team_b}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(m.match_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge className={m.status === "live" ? "bg-neon-red/20 text-neon-red" : "gradient-primary text-primary-foreground"}>
                      {m.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Prediction form */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">Place Prediction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedMatch ? (
                <>
                  <p className="text-sm text-primary font-display">{selectedMatch.team_a} vs {selectedMatch.team_b}</p>

                  <Select value={predictionType} onValueChange={setPredictionType}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="winner">Match Winner</SelectItem>
                      <SelectItem value="motm">Man of the Match</SelectItem>
                      <SelectItem value="top_batsman">Top Batsman</SelectItem>
                      <SelectItem value="top_bowler">Top Bowler</SelectItem>
                    </SelectContent>
                  </Select>

                  {predictionType === "winner" ? (
                    <Select value={predictionValue} onValueChange={setPredictionValue}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={selectedMatch.team_a}>{selectedMatch.team_a}</SelectItem>
                        <SelectItem value={selectedMatch.team_b}>{selectedMatch.team_b}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Player name"
                      value={predictionValue}
                      onChange={e => setPredictionValue(e.target.value)}
                      className="bg-secondary border-border"
                    />
                  )}

                  <Input type="number" placeholder="Amount (min ₹50)" value={betAmount} onChange={e => setBetAmount(e.target.value)} className="bg-secondary border-border" min={50} />
                  <Button onClick={placePrediction} disabled={placing} className="w-full gradient-primary text-primary-foreground font-display">
                    Submit Prediction
                  </Button>
                  {wallet && <p className="text-xs text-muted-foreground">Balance: ₹{wallet.balance}</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a match to make predictions</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* My predictions */}
        <Card className="gradient-card border-border/50">
          <CardHeader><CardTitle className="font-display text-lg">My Predictions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myPredictions.map(p => {
                const match = p.cricket_matches as any;
                return (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{match?.team_a} vs {match?.team_b}</p>
                      <p className="text-xs text-muted-foreground capitalize">{p.prediction_type}: {p.prediction_value}</p>
                      {match?.result_set_at && (
                        <p className="text-xs text-muted-foreground/70 mt-0.5">
                          Result verified on {new Date(match.result_set_at).toLocaleString()} by {match.result_set_by}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-display text-foreground">₹{p.amount}</p>
                      <Badge variant="secondary" className={`text-xs ${p.status === "won" ? "text-primary" : p.status === "lost" ? "text-neon-red" : "text-muted-foreground"}`}>
                        {p.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
              {myPredictions.length === 0 && <p className="text-sm text-muted-foreground">No predictions yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default CricketPredictions;
