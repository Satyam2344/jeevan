import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Spade, Palette, Circle, Trophy, Medal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { previewMap } from "@/components/landing/GamePreviews";

const iconMap: Record<string, any> = {
  rummy: Spade,
  color_trading: Palette,
  ball_pool: Circle,
  motm: Trophy,
  ipl_prediction: Medal,
};

const colorMap: Record<string, string> = {
  rummy: "text-neon-red",
  color_trading: "text-neon-orange",
  ball_pool: "text-neon-blue",
  motm: "text-gold",
  ipl_prediction: "text-neon-purple",
};

const borderMap: Record<string, string> = {
  rummy: "border-neon-red/30",
  color_trading: "border-neon-orange/30",
  ball_pool: "border-neon-blue/30",
  motm: "border-gold/30",
  ipl_prediction: "border-neon-purple/30",
};

const glowMap: Record<string, string> = {
  rummy: "hover:shadow-[0_0_20px_hsl(0_80%_55%/0.3)]",
  color_trading: "hover:shadow-[0_0_20px_hsl(25_95%_55%/0.3)]",
  ball_pool: "hover:shadow-[0_0_20px_hsl(210_90%_55%/0.3)]",
  motm: "hover:shadow-[0_0_20px_hsl(45_90%_55%/0.3)]",
  ipl_prediction: "hover:shadow-[0_0_20px_hsl(270_70%_60%/0.3)]",
};

const routeMap: Record<string, string> = {
  rummy: "/games/rummy",
  color_trading: "/games/color-trading",
  ball_pool: "/games/ball-pool",
  motm: "/games/cricket-predictions",
  ipl_prediction: "/games/ipl-prediction",
};

const GameModules = () => {
  const [games, setGames] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("game_configs").select("*").then(({ data }) => setGames(data || []));
  }, []);

  return (
    <section id="games" className="py-24 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Game <span className="text-primary text-glow">Modules</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Five thrilling skill-based games and prediction contests
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game, i) => {
            const Icon = iconMap[game.game_type] || Zap;
            const Preview = previewMap[game.game_type];
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`group gradient-card rounded-xl border ${borderMap[game.game_type] || "border-border/50"} overflow-hidden transition-all duration-300 ${game.is_active ? glowMap[game.game_type] || "" : "opacity-60"} cursor-pointer`}
              >
                {/* Live game preview area */}
                <div className="relative bg-background/60 border-b border-border/30">
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {game.is_active && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
                        LIVE
                      </span>
                    )}
                  </div>
                  {Preview ? (
                    <div className="pt-8 pb-2">
                      <Preview />
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center">
                      <Icon className={`h-12 w-12 ${colorMap[game.game_type] || "text-primary"} opacity-30`} />
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${colorMap[game.game_type] || "text-primary"}`} />
                      <h3 className="font-display text-lg font-bold text-foreground">{game.title}</h3>
                    </div>
                    {!game.is_active && (
                      <Badge variant="secondary" className="text-xs">Disabled</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
                  <Link to={routeMap[game.game_type] || "/games"} className="mt-auto">
                    <Button
                      className="w-full gradient-primary text-primary-foreground font-display tracking-wider"
                      size="sm"
                      disabled={!game.is_active}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {game.is_active ? "Play Now" : "Coming Soon"}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GameModules;
