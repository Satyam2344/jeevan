import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Calendar, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminMatches = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    const { data } = await supabase.from("cricket_matches").select("*").order("match_date", { ascending: false });
    setMatches(data || []);
  };

  const addMatch = async () => {
    if (!teamA || !teamB || !matchDate) return toast.error("Fill all fields");
    await supabase.from("cricket_matches").insert({ team_a: teamA, team_b: teamB, match_date: matchDate, venue });
    toast.success("Match added!");
    setTeamA(""); setTeamB(""); setMatchDate(""); setVenue("");
    fetchMatches();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("cricket_matches").update({ status }).eq("id", id);
    toast.success(`Match set to ${status}`);
    fetchMatches();
  };

  const setResult = async (id: string, winner: string, motm: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("cricket_matches").update({
      winner_team: winner,
      man_of_match: motm,
      status: "completed",
      result_set_by: user?.email || "admin",
      result_set_at: new Date().toISOString(),
    }).eq("id", id);
    toast.success("Result saved with audit trail!");
    fetchMatches();
  };

  const deleteMatch = async (id: string) => {
    if (!confirm("Delete this match? This will also remove all predictions for it.")) return;
    await supabase.from("match_predictions").delete().eq("match_id", id);
    await supabase.from("cricket_matches").delete().eq("id", id);
    toast.success("Match deleted");
    fetchMatches();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold">Match <span className="text-primary text-glow">Management</span></h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground font-display"><Plus className="h-4 w-4 mr-2" /> Add Match</Button>
          </DialogTrigger>
          <DialogContent className="gradient-card border-border">
            <DialogHeader><DialogTitle className="font-display">Add Cricket Match</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-4">
              <Input placeholder="Team A (e.g. CSK)" value={teamA} onChange={e => setTeamA(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Team B (e.g. MI)" value={teamB} onChange={e => setTeamB(e.target.value)} className="bg-secondary border-border" />
              <Input type="datetime-local" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="bg-secondary border-border" />
              <Input placeholder="Venue" value={venue} onChange={e => setVenue(e.target.value)} className="bg-secondary border-border" />
              <Button onClick={addMatch} className="w-full gradient-primary text-primary-foreground font-display">Add Match</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {matches.map(m => (
          <Card key={m.id} className="gradient-card border-border/50">
            <CardContent className="flex items-center justify-between p-5 flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Trophy className={`h-6 w-6 ${m.status === "live" ? "text-neon-red animate-pulse-glow" : "text-primary"}`} />
                <div>
                  <p className="font-display font-bold text-foreground">{m.team_a} vs {m.team_b}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(m.match_date).toLocaleString()} {m.venue && `• ${m.venue}`}
                  </p>
                  {m.winner_team && (
                    <div>
                      <p className="text-xs text-primary mt-1">Winner: {m.winner_team} | MOTM: {m.man_of_match}</p>
                      {m.result_set_by && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ⚠️ Result set by: {m.result_set_by} on {new Date(m.result_set_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${m.status === "live" ? "bg-neon-red/20 text-neon-red" : m.status === "upcoming" ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {m.status}
                </Badge>
                {m.status === "upcoming" && (
                  <Button size="sm" variant="outline" className="text-xs border-neon-red/40 text-neon-red" onClick={() => updateStatus(m.id, "live")}>
                    Set Live
                  </Button>
                )}
                {m.status === "live" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="text-xs border-primary/40 text-primary">Set Result</Button>
                    </DialogTrigger>
                    <DialogContent className="gradient-card border-border">
                      <DialogHeader><DialogTitle className="font-display text-sm">Set Match Result</DialogTitle></DialogHeader>
                      <form onSubmit={e => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        setResult(m.id, fd.get("winner") as string, fd.get("motm") as string);
                      }} className="space-y-3 pt-2">
                        <Select name="winner">
                          <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Winner" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={m.team_a}>{m.team_a}</SelectItem>
                            <SelectItem value={m.team_b}>{m.team_b}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input name="motm" placeholder="Man of the Match" className="bg-secondary border-border" />
                        <Button type="submit" className="w-full gradient-primary text-primary-foreground">Save Result</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
                <Button size="sm" variant="outline" className="text-xs border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => deleteMatch(m.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {matches.length === 0 && <p className="text-sm text-muted-foreground">No matches. Add one above.</p>}
      </div>
    </div>
  );
};

export default AdminMatches;
