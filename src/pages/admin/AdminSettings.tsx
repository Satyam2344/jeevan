import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminSettings = () => {
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("game_configs").select("*").order("created_at").then(({ data }) => setGames(data || []));
  }, []);

  const toggleAllGames = async (active: boolean) => {
    setLoading(true);
    for (const g of games) {
      await supabase.from("game_configs").update({ is_active: active }).eq("id", g.id);
    }
    toast.success(active ? "All games enabled" : "Maintenance mode: all games disabled");
    const { data } = await supabase.from("game_configs").select("*").order("created_at");
    setGames(data || []);
    setLoading(false);
  };

  const updateGlobalBets = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const minBet = parseInt(fd.get("global_min") as string);
    const maxBet = parseInt(fd.get("global_max") as string);
    const commission = parseFloat(fd.get("global_commission") as string);

    if (isNaN(minBet) || isNaN(maxBet)) return toast.error("Enter valid numbers");

    setLoading(true);
    for (const g of games) {
      const updates: any = {};
      if (!isNaN(minBet)) updates.min_bet = minBet;
      if (!isNaN(maxBet)) updates.max_bet = maxBet;
      if (!isNaN(commission)) updates.commission_percent = commission;
      await supabase.from("game_configs").update(updates).eq("id", g.id);
    }
    toast.success("Global bet limits updated for all games");
    const { data } = await supabase.from("game_configs").select("*").order("created_at");
    setGames(data || []);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-display font-bold mb-6">
        Platform <span className="text-primary text-glow">Settings</span>
      </h1>

      <div className="space-y-6">
        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Platform Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Disable all games temporarily</p>
              </div>
              <Button size="sm" variant="outline" disabled={loading}
                className="border-neon-red/40 text-neon-red hover:bg-neon-red/10"
                onClick={() => toggleAllGames(false)}>
                Disable All
              </Button>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-foreground">Enable All Games</p>
                <p className="text-xs text-muted-foreground">Re-enable all games after maintenance</p>
              </div>
              <Button size="sm" variant="outline" disabled={loading}
                className="border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => toggleAllGames(true)}>
                Enable All
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Global Bet Limits</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={updateGlobalBets} className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Min Bet (₹) — applies to all games</Label>
                <Input name="global_min" type="number" defaultValue={games[0]?.min_bet || 10} className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Max Bet (₹) — applies to all games</Label>
                <Input name="global_max" type="number" defaultValue={games[0]?.max_bet || 10000} className="bg-secondary border-border mt-1" />
              </div>
              <div>
                <Label className="text-muted-foreground">Commission % — applies to all games</Label>
                <Input name="global_commission" type="number" step="0.01" defaultValue={games[0]?.commission_percent || 5} className="bg-secondary border-border mt-1" />
              </div>
              <Button type="submit" disabled={loading} className="gradient-primary text-primary-foreground font-display">
                Update All Games
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg">Active Games ({games.filter(g => g.is_active).length}/{games.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {games.map(g => (
              <div key={g.id} className="flex items-center justify-between py-1">
                <span className="text-sm text-foreground">{g.title}</span>
                <Badge className={g.is_active ? "gradient-primary text-primary-foreground text-xs" : "text-xs"} variant={g.is_active ? "default" : "secondary"}>
                  {g.is_active ? "Live" : "Disabled"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
