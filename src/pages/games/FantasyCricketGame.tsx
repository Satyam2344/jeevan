import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trophy, Users, Star, Crown, Medal, Calendar, Zap, Radio, Swords, Target, Shield, CircleUser } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";
import LiveScorecard from "@/components/LiveScorecard";

const roleConfig: Record<string, { label: string; color: string; icon: typeof Swords; bg: string }> = {
  batsman: { label: "Batsman", color: "text-primary", icon: Swords, bg: "bg-primary/10" },
  bowler: { label: "Bowler", color: "text-neon-red", icon: Target, bg: "bg-neon-red/10" },
  all_rounder: { label: "All-Rounder", color: "text-neon-orange", icon: Star, bg: "bg-neon-orange/10" },
  wicket_keeper: { label: "Wicket Keeper", color: "text-neon-blue", icon: Shield, bg: "bg-neon-blue/10" },
};

const FantasyCricketGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("fantasy");
  const { user, wallet, refreshWallet } = useAuth();
  const [contests, setContests] = useState<any[]>([]);
  const [selectedContest, setSelectedContest] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<any[]>([]);
  const [captain, setCaptain] = useState("");
  const [viceCaptain, setViceCaptain] = useState("");
  const [teamName, setTeamName] = useState("My Dream Team");
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [joining, setJoining] = useState(false);
  const [tab, setTab] = useState("contests");

  useEffect(() => {
    fetchContests();
    if (user) fetchMyTeams();
  }, [user]);

  const fetchContests = async () => {
    const { data } = await (supabase as any)
      .from("fantasy_contests")
      .select("*, cricket_matches(*)")
      .in("status", ["upcoming", "live", "completed"])
      .order("created_at", { ascending: false });
    setContests(data || []);
  };

  const fetchMyTeams = async () => {
    if (!user) return;
    const { data } = await (supabase as any)
      .from("fantasy_teams")
      .select("*, fantasy_contests(*, cricket_matches(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyTeams(data || []);
  };

  const selectContest = async (contest: any) => {
    setSelectedContest(contest);
    setSelectedPlayers([]);
    setCaptain("");
    setViceCaptain("");
    const { data } = await (supabase as any)
      .from("fantasy_players")
      .select("*")
      .eq("match_id", contest.match_id)
      .eq("is_playing", true)
      .order("credits", { ascending: false });
    setPlayers(data || []);

    // fetch leaderboard
    const { data: lb } = await (supabase as any)
      .from("fantasy_teams")
      .select("*, profiles!inner(display_name, username)")
      .eq("contest_id", contest.id)
      .order("total_points", { ascending: false })
      .limit(10);
    setLeaderboard(lb || []);
    setTab("create-team");
  };

  const togglePlayer = (player: any) => {
    if (selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
      if (captain === player.player_name) setCaptain("");
      if (viceCaptain === player.player_name) setViceCaptain("");
    } else {
      if (selectedPlayers.length >= 11) return toast.error("Max 11 players");
      const totalCredits = selectedPlayers.reduce((s, p) => s + Number(p.credits), 0) + Number(player.credits);
      if (totalCredits > 100) return toast.error("Credit limit exceeded (100)");
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const totalCredits = selectedPlayers.reduce((s, p) => s + Number(p.credits), 0);

  const joinContest = async () => {
    if (!user) return toast.error("Please sign in");
    if (!selectedContest) return;
    if (selectedPlayers.length !== 11) return toast.error("Select exactly 11 players");
    if (!captain) return toast.error("Select a captain");
    if (!viceCaptain) return toast.error("Select a vice-captain");
    if (captain === viceCaptain) return toast.error("Captain and Vice-Captain must be different");

    const fee = selectedContest.entry_fee;
    if ((wallet?.balance || 0) < fee) return toast.error("Insufficient balance");

    setJoining(true);
    try {
      // Deduct entry fee
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - fee }).eq("user_id", user.id);

      // Create team
      const { error } = await (supabase as any).from("fantasy_teams").insert({
        contest_id: selectedContest.id,
        user_id: user.id,
        team_name: teamName,
        players: selectedPlayers.map(p => ({ id: p.id, name: p.player_name, role: p.role })),
        captain,
        vice_captain: viceCaptain,
      });
      if (error) throw error;

      // Update contest participants
      await (supabase as any).from("fantasy_contests").update({
        current_participants: (selectedContest.current_participants || 0) + 1,
        prize_pool: (selectedContest.prize_pool || 0) + fee,
      }).eq("id", selectedContest.id);

      // Log transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "game_entry",
        amount: -fee,
        status: "completed",
        description: `Fantasy Cricket - ${selectedContest.title}`,
      });

      toast.success("Team created! Good luck!");
      refreshWallet();
      fetchMyTeams();
      fetchContests();
      setTab("my-teams");
    } catch (err: any) {
      toast.error(err.message?.includes("unique") ? "Already joined this contest" : err.message || "Error joining");
      // refund on error
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) }).eq("user_id", user.id);
    } finally {
      setJoining(false);
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Fantasy Cricket" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-6xl">
        <h1 className="text-4xl font-display font-bold mb-2">
          <Crown className="inline h-8 w-8 text-primary mr-2" />
          Fantasy <span className="text-primary text-glow">Cricket</span>
        </h1>
        <p className="text-muted-foreground mb-6">Build your dream team & win big</p>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="contests">Contests</TabsTrigger>
            <TabsTrigger value="create-team">Create Team</TabsTrigger>
            <TabsTrigger value="my-teams">My Teams</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="live-scores">Live Scores</TabsTrigger>
          </TabsList>

          {/* CONTESTS TAB */}
          <TabsContent value="contests">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {contests.length === 0 && <p className="text-muted-foreground col-span-2">No contests available. Check back soon!</p>}
              {contests.map(c => {
                const match = c.cricket_matches;
                const isFull = c.current_participants >= c.max_participants;
                const alreadyJoined = myTeams.some(t => t.contest_id === c.id);
                return (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="gradient-card border-border/50 hover:border-primary/30 transition-all">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-display font-bold text-foreground">{c.title}</h3>
                            {match && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Calendar className="h-3 w-3" />
                                {match.team_a} vs {match.team_b} • {new Date(match.match_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <Badge className={c.status === "live" ? "bg-neon-red/20 text-neon-red" : c.status === "completed" ? "bg-secondary text-muted-foreground" : "gradient-primary text-primary-foreground"}>
                            {c.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
                          <div className="bg-secondary/50 rounded-lg p-2">
                            <p className="text-muted-foreground">Entry</p>
                            <p className="font-display font-bold text-foreground">₹{c.entry_fee}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-lg p-2">
                            <p className="text-muted-foreground">Prize Pool</p>
                            <p className="font-display font-bold text-primary">₹{c.prize_pool}</p>
                          </div>
                          <div className="bg-secondary/50 rounded-lg p-2">
                            <p className="text-muted-foreground">Spots</p>
                            <p className="font-display font-bold text-foreground">{c.current_participants}/{c.max_participants}</p>
                          </div>
                        </div>
                        <Button
                          className="w-full gradient-primary text-primary-foreground font-display"
                          size="sm"
                          disabled={isFull || alreadyJoined || c.status !== "upcoming"}
                          onClick={() => selectContest(c)}
                        >
                          {alreadyJoined ? "Already Joined" : isFull ? "Full" : c.status !== "upcoming" ? "Closed" : "Join Contest"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* CREATE TEAM TAB */}
          <TabsContent value="create-team">
            {!selectedContest ? (
              <p className="text-muted-foreground">Select a contest first from the Contests tab.</p>
            ) : (
              <div className="space-y-6">
                <Card className="gradient-card border-border/50">
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-display font-bold text-foreground">{selectedContest.title}</p>
                      <p className="text-xs text-muted-foreground">Entry: ₹{selectedContest.entry_fee}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Players</p>
                        <p className={`font-display font-bold ${selectedPlayers.length === 11 ? "text-primary" : "text-foreground"}`}>{selectedPlayers.length}/11</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Credits</p>
                        <p className={`font-display font-bold ${totalCredits > 100 ? "text-neon-red" : "text-foreground"}`}>{totalCredits.toFixed(1)}/100</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Input
                  placeholder="Team Name"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  className="bg-secondary border-border max-w-sm"
                />

                {/* Player Selection - Team Wise */}
                {(() => {
                  const match = selectedContest.cricket_matches;
                  const teamA = match?.team_a || "Team A";
                  const teamB = match?.team_b || "Team B";
                  const teamAPlayers = players.filter(p => p.team === teamA);
                  const teamBPlayers = players.filter(p => p.team === teamB);
                  const otherPlayers = players.filter(p => p.team !== teamA && p.team !== teamB);
                  
                  const renderPlayerCard = (p: any) => {
                    const isSelected = selectedPlayers.find(sp => sp.id === p.id);
                    const isCaptain = captain === p.player_name;
                    const isVC = viceCaptain === p.player_name;
                    const role = roleConfig[p.role] || { label: p.role, color: "text-muted-foreground", icon: CircleUser, bg: "bg-muted" };
                    const RoleIcon = role.icon;
                    return (
                      <Card
                        key={p.id}
                        className={`cursor-pointer transition-all ${isSelected ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/5" : "gradient-card border-border/30 hover:border-border hover:shadow-md"}`}
                        onClick={() => togglePlayer(p)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            {/* Player Avatar */}
                            <div className={`relative w-12 h-12 rounded-full ${role.bg} flex items-center justify-center shrink-0 border-2 ${isSelected ? "border-primary" : "border-border/50"}`}>
                              <CircleUser className={`h-7 w-7 ${role.color}`} />
                              {(isCaptain || isVC) && (
                                <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${isCaptain ? "bg-primary text-primary-foreground shadow-lg shadow-primary/40" : "bg-neon-orange text-white shadow-lg shadow-neon-orange/40"}`}>
                                  {isCaptain ? "C" : "VC"}
                                </div>
                              )}
                            </div>

                            {/* Player Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold text-sm text-foreground truncate">{p.player_name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <RoleIcon className={`h-3 w-3 ${role.color}`} />
                                <span className={`text-[11px] font-semibold ${role.color}`}>{role.label}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5">{p.team}</p>
                            </div>

                            {/* Credits & Actions */}
                            <div className="flex flex-col items-end gap-1.5">
                              <Badge variant="secondary" className="text-[10px] font-display font-bold px-2 py-0.5">
                                {p.credits} CR
                              </Badge>
                              {isSelected && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={e => { e.stopPropagation(); setCaptain(p.player_name); }}
                                    className={`w-7 h-7 rounded-full text-[10px] font-black border-2 transition-all ${isCaptain ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg shadow-primary/30" : "border-border text-muted-foreground hover:border-primary/50 hover:text-primary"}`}
                                    title="Set as Captain (2x points)"
                                  >
                                    C
                                  </button>
                                  <button
                                    onClick={e => { e.stopPropagation(); setViceCaptain(p.player_name); }}
                                    className={`w-7 h-7 rounded-full text-[10px] font-black border-2 transition-all ${isVC ? "bg-neon-orange text-white border-neon-orange scale-110 shadow-lg shadow-neon-orange/30" : "border-border text-muted-foreground hover:border-neon-orange/50 hover:text-neon-orange"}`}
                                    title="Set as Vice-Captain (1.5x points)"
                                  >
                                    VC
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  };

                  return (
                    <div className="space-y-6">
                      {players.length === 0 && <p className="text-muted-foreground">No playing XI announced for this match yet.</p>}
                      
                      {teamAPlayers.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                            <Badge className="bg-primary/20 text-primary">{teamA}</Badge>
                            <span className="text-xs text-muted-foreground">({teamAPlayers.length} players)</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {teamAPlayers.map(renderPlayerCard)}
                          </div>
                        </div>
                      )}

                      {teamBPlayers.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                            <Badge className="bg-neon-red/20 text-neon-red">{teamB}</Badge>
                            <span className="text-xs text-muted-foreground">({teamBPlayers.length} players)</span>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {teamBPlayers.map(renderPlayerCard)}
                          </div>
                        </div>
                      )}

                      {otherPlayers.length > 0 && (
                        <div>
                          <h3 className="font-display font-bold text-foreground mb-3">Other Players</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {otherPlayers.map(renderPlayerCard)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <Button
                  onClick={joinContest}
                  disabled={joining || selectedPlayers.length !== 11}
                  className="gradient-primary text-primary-foreground font-display px-8"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {joining ? "Joining..." : `Join Contest (₹${selectedContest.entry_fee})`}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* MY TEAMS TAB */}
          <TabsContent value="my-teams">
            <div className="space-y-4">
              {myTeams.length === 0 && <p className="text-muted-foreground">No teams yet. Join a contest!</p>}
              {myTeams.map(t => {
                const contest = t.fantasy_contests;
                const match = contest?.cricket_matches;
                const teamPlayers = (t.players as any[]) || [];
                return (
                  <Card key={t.id} className="gradient-card border-border/50">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-display font-bold text-foreground">{t.team_name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {contest?.title} • {match?.team_a} vs {match?.team_b}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-primary text-lg">{t.total_points} pts</p>
                          {t.rank && <p className="text-xs text-muted-foreground">Rank #{t.rank}</p>}
                          {t.payout > 0 && <p className="text-xs text-primary font-bold">Won ₹{t.payout}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {teamPlayers.map((p: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {p.name === t.captain ? "👑 " : p.name === t.vice_captain ? "⭐ " : ""}{p.name}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* LEADERBOARD TAB */}
          <TabsContent value="leaderboard">
            {!selectedContest ? (
              <p className="text-muted-foreground">Select a contest to view leaderboard.</p>
            ) : (
              <Card className="gradient-card border-border/50">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Top 10 Winners - {selectedContest.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {leaderboard.length === 0 && <p className="text-muted-foreground text-sm">No teams yet.</p>}
                    {leaderboard.map((t: any, i: number) => (
                      <div key={t.id} className={`flex items-center justify-between p-3 rounded-lg ${i < 3 ? "bg-primary/5 border border-primary/20" : "bg-secondary/30"}`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${i === 0 ? "bg-primary text-primary-foreground" : i === 1 ? "bg-muted text-foreground" : i === 2 ? "bg-neon-orange/20 text-neon-orange" : "bg-secondary text-muted-foreground"}`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-display font-semibold text-sm text-foreground">{t.team_name}</p>
                            <p className="text-xs text-muted-foreground">{t.profiles?.display_name || t.profiles?.username || "Player"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-primary">{t.total_points} pts</p>
                          {t.payout > 0 && <p className="text-xs text-primary">₹{t.payout}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* LIVE SCORES TAB */}
          <TabsContent value="live-scores">
            <LiveScorecard />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default FantasyCricketGame;
