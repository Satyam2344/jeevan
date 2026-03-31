import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface CricketMatch {
  id: string;
  name: string;
  status: string;
  venue: string;
  teams: string[];
  score: { inning: string; r: number; w: number; o: number }[];
  matchStarted: boolean;
  matchEnded: boolean;
  matchType: string;
}

const LiveScorecard = () => {
  const [matches, setMatches] = useState<CricketMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enabled, setEnabled] = useState(true);

  const checkEnabled = async () => {
    try {
      const { data } = await supabase.from("game_configs").select("settings").eq("game_type", "fantasy").single();
      if (data?.settings && (data.settings as any).live_scores_enabled === false) {
        setEnabled(false);
        setLoading(false);
        return false;
      }
    } catch {}
    return true;
  };

  const fetchMatches = async () => {
    setLoading(true);
    setError("");
    try {
      const isEnabled = await checkEnabled();
      if (!isEnabled) return;

      const { data, error: fnError } = await supabase.functions.invoke("cricket-scores");
      if (fnError) throw fnError;
      if (data?.status === "success" && data.data) {
        setMatches(data.data.filter((m: CricketMatch) => m.matchStarted));
      } else {
        setMatches([]);
        setError(data?.message || "No live matches available right now.");
      }
    } catch {
      setError("Unable to fetch live scores. Try again later.");
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold flex items-center gap-2 text-foreground">
          <Radio className="h-5 w-5 text-neon-red animate-pulse" />
          Live International Matches
        </h2>
        <Button variant="outline" size="sm" onClick={fetchMatches} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && matches.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">Loading live scores...</div>
      )}

      {error && (
        <Card className="gradient-card border-border/50">
          <CardContent className="p-4 text-center text-muted-foreground text-sm">{error}</CardContent>
        </Card>
      )}

      {matches.length === 0 && !loading && !error && (
        <Card className="gradient-card border-border/50">
          <CardContent className="p-4 text-center text-muted-foreground text-sm">No live matches at the moment.</CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matches.map(m => (
          <Card key={m.id} className="gradient-card border-border/50 hover:border-primary/30 transition-all">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Badge className={m.matchEnded ? "bg-secondary text-muted-foreground" : "bg-neon-red/20 text-neon-red"}>
                  {m.matchEnded ? "Completed" : "LIVE"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{m.venue?.substring(0, 30)}</span>
              </div>
              <h3 className="font-display font-bold text-sm text-foreground mb-2">{m.name}</h3>
              {m.score && m.score.length > 0 && (
                <div className="space-y-1">
                  {m.score.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{s.inning?.substring(0, 20)}</span>
                      <span className="font-display font-bold text-sm text-primary">
                        {s.r}/{s.w} ({s.o} ov)
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">{m.status}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LiveScorecard;
