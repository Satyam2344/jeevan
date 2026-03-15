import { useState, useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Spade, Users, Plus, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { useGameActive } from "@/hooks/useGameActive";
import GameDisabled from "@/components/GameDisabled";

const RummyGame = () => {
  const { isActive, loading: gameLoading } = useGameActive("rummy");
  const { user, wallet, refreshWallet } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [tableName, setTableName] = useState("");
  const [entryFee, setEntryFee] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchTables = async () => {
    const { data } = await supabase
      .from("rummy_tables")
      .select("*")
      .in("status", ["waiting", "playing"])
      .order("created_at", { ascending: false });
    setTables(data || []);
  };

  const createTable = async () => {
    if (!user) return toast.error("Please sign in");
    const fee = parseInt(entryFee);
    if (!tableName) return toast.error("Enter table name");
    if (!fee || fee < 50) return toast.error("Min entry ₹50");
    if (fee > (wallet?.balance || 0)) return toast.error("Insufficient balance");

    setCreating(true);
    try {
      const { data: table } = await supabase.from("rummy_tables").insert({
        name: tableName,
        entry_fee: fee,
        max_players: parseInt(maxPlayers),
        current_players: 1,
        prize_pool: fee,
      }).select().single();

      if (table) {
        await supabase.from("rummy_players").insert({ table_id: table.id, user_id: user.id });
        await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - fee }).eq("user_id", user.id);
        await supabase.from("transactions").insert({ user_id: user.id, type: "game_entry", amount: -fee, status: "completed", description: `Rummy - ${tableName}` });
      }
      toast.success("Table created! Waiting for players...");
      setTableName("");
      setEntryFee("");
      refreshWallet();
      fetchTables();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const joinTable = async (table: any) => {
    if (!user) return toast.error("Please sign in");
    if (table.entry_fee > (wallet?.balance || 0)) return toast.error("Insufficient balance");
    if (table.current_players >= table.max_players) return toast.error("Table is full");

    try {
      await supabase.from("rummy_players").insert({ table_id: table.id, user_id: user.id });
      await supabase.from("rummy_tables").update({
        current_players: table.current_players + 1,
        prize_pool: table.prize_pool + table.entry_fee,
        status: table.current_players + 1 >= table.max_players ? "playing" : "waiting",
      }).eq("id", table.id);
      await supabase.from("wallets").update({ balance: (wallet?.balance || 0) - table.entry_fee }).eq("user_id", user.id);
      await supabase.from("transactions").insert({ user_id: user.id, type: "game_entry", amount: -table.entry_fee, status: "completed", description: `Rummy - Joined ${table.name}` });
      toast.success("Joined table!");
      refreshWallet();
      fetchTables();
    } catch (err: any) {
      toast.error("Already joined or error");
    }
  };

  if (gameLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Loading...</span></div>;
  if (isActive === false) return <GameDisabled title="Rummy" />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl font-display font-bold mb-8">
          <Spade className="inline h-8 w-8 text-neon-red mr-2" />
          Rummy <span className="text-neon-red">Card Game</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Create table */}
          <Card className="gradient-card border-neon-red/30">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Plus className="h-5 w-5" /> Create Table
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Table name" value={tableName} onChange={e => setTableName(e.target.value)} className="bg-secondary border-border" />
              <Input type="number" placeholder="Entry fee (min ₹50)" value={entryFee} onChange={e => setEntryFee(e.target.value)} className="bg-secondary border-border" min={50} />
              <select value={maxPlayers} onChange={e => setMaxPlayers(e.target.value)} className="w-full rounded-lg bg-secondary border border-border text-foreground p-2 text-sm">
                <option value="2">2 Players</option>
                <option value="3">3 Players</option>
                <option value="4">4 Players</option>
                <option value="6">6 Players</option>
              </select>
              <Button onClick={createTable} disabled={creating} className="w-full gradient-primary text-primary-foreground font-display">
                Create Table
              </Button>
              {wallet && <p className="text-xs text-muted-foreground">Balance: ₹{wallet.balance}</p>}
            </CardContent>
          </Card>

          {/* Info */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="font-display text-lg">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>1. Create a table or join an existing one</p>
              <p>2. Pay the entry fee from your wallet</p>
              <p>3. Once the table is full, the game starts</p>
              <p>4. Winner takes the entire prize pool (minus commission)</p>
              <p>5. Private tables get a unique code to share</p>
              <p className="text-xs text-primary mt-4">* Real-time multiplayer rummy requires WebSocket integration (coming soon). Currently supports table creation and joining.</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables list */}
        <h2 className="font-display text-xl font-bold mb-4 text-foreground">Open Tables</h2>
        <div className="space-y-3">
          {tables.map(t => (
            <Card key={t.id} className="gradient-card border-border/50">
              <CardContent className="flex items-center justify-between p-4 flex-wrap gap-3">
                <div>
                  <p className="font-display font-bold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Code: {t.table_code} • {t.is_private ? "Private" : "Public"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="font-display text-primary">₹{t.entry_fee}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Prize</p>
                    <p className="font-display text-gold">₹{t.prize_pool}</p>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Users className="h-3 w-3" /> {t.current_players}/{t.max_players}
                  </Badge>
                  {t.status === "waiting" && (
                    <Button size="sm" onClick={() => joinTable(t)} className="gradient-primary text-primary-foreground font-display">
                      <LogIn className="h-3 w-3 mr-1" /> Join
                    </Button>
                  )}
                  {t.status === "playing" && <Badge className="bg-neon-red/20 text-neon-red">In Game</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
          {tables.length === 0 && <p className="text-sm text-muted-foreground">No open tables. Create one!</p>}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RummyGame;
