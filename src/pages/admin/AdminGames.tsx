import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Spade, Palette, Circle, Trophy, Medal, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const iconMap: Record<string, any> = { rummy: Spade, color_trading: Palette, ball_pool: Circle, motm: Trophy, ipl_prediction: Medal };

const AdminGames = () => {
  const [games, setGames] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);

  useEffect(() => { fetchGames(); }, []);

  const fetchGames = async () => {
    const { data } = await supabase.from("game_configs").select("*").order("created_at");
    setGames(data || []);
  };

  const toggleGame = async (id: string, active: boolean) => {
    await supabase.from("game_configs").update({ is_active: !active }).eq("id", id);
    toast.success(`Game ${active ? "disabled" : "enabled"}`);
    fetchGames();
  };

  const updateConfig = async (id: string, updates: any) => {
    await supabase.from("game_configs").update(updates).eq("id", id);
    toast.success("Config updated");
    setEditing(null);
    fetchGames();
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">Game <span className="text-primary text-glow">Configuration</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => {
          const Icon = iconMap[game.game_type] || Settings;
          return (
            <Card key={game.id} className="gradient-card border-border/50">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="font-display text-base">{game.title}</CardTitle>
                </div>
                <Switch checked={game.is_active} onCheckedChange={() => toggleGame(game.id, game.is_active)} />
              </CardHeader>
              <CardContent>
                {editing === game.id ? (
                  <form onSubmit={e => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    updateConfig(game.id, {
                      min_bet: parseInt(form.get("min_bet") as string),
                      max_bet: parseInt(form.get("max_bet") as string),
                      commission_percent: parseFloat(form.get("commission") as string),
                    });
                  }} className="space-y-2">
                    <Input name="min_bet" type="number" defaultValue={game.min_bet} placeholder="Min bet" className="bg-secondary border-border" />
                    <Input name="max_bet" type="number" defaultValue={game.max_bet} placeholder="Max bet" className="bg-secondary border-border" />
                    <Input name="commission" type="number" step="0.01" defaultValue={game.commission_percent} placeholder="Commission %" className="bg-secondary border-border" />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" className="gradient-primary text-primary-foreground">Save</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(null)} className="text-muted-foreground">Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Min Bet</span><span className="text-foreground">₹{game.min_bet}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Max Bet</span><span className="text-foreground">₹{game.max_bet}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-muted-foreground">Commission</span><span className="text-foreground">{game.commission_percent}%</span></div>
                    </div>
                    <Badge variant={game.is_active ? "default" : "secondary"} className={game.is_active ? "gradient-primary text-primary-foreground" : ""}>
                      {game.is_active ? "Live" : "Disabled"}
                    </Badge>
                    <Button variant="outline" size="sm" className="w-full mt-3 border-border text-muted-foreground hover:text-primary hover:border-primary/50" onClick={() => setEditing(game.id)}>
                      <Settings className="h-3 w-3 mr-2" /> Configure
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminGames;
