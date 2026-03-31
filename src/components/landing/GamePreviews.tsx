import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export const ColorTradingPreview = () => {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setActive(a => (a + 1) % 3), 1200);
    return () => clearInterval(i);
  }, []);
  const colors = ["#ef4444", "#22c55e", "#3b82f6"];
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {colors.map((c, idx) => (
        <motion.div
          key={c}
          animate={{ scale: active === idx ? 1.3 : 0.9, opacity: active === idx ? 1 : 0.4 }}
          transition={{ duration: 0.4 }}
          className="w-8 h-8 rounded-lg"
          style={{ background: c }}
        />
      ))}
      <motion.div
        key={active}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        className="ml-2 text-xs font-display font-bold text-primary"
      >
        3x
      </motion.div>
    </div>
  );
};

export const BallPoolPreview = () => {
  const [ball, setBall] = useState(1);
  useEffect(() => {
    const i = setInterval(() => setBall(b => (b % 10) + 1), 800);
    return () => clearInterval(i);
  }, []);
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#f43f5e", "#a855f7"];
  return (
    <div className="flex items-center justify-center gap-1.5 py-3">
      {[1, 2, 3, 4, 5].map(n => (
        <motion.div
          key={n}
          animate={{
            scale: ball === n ? 1.4 : 0.8,
            opacity: ball === n ? 1 : 0.3,
            y: ball === n ? -6 : 0,
          }}
          transition={{ type: "spring", stiffness: 300 }}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-foreground"
          style={{ background: colors[n - 1] }}
        >
          {n}
        </motion.div>
      ))}
    </div>
  );
};

export const RummyPreview = () => {
  const [dealt, setDealt] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setDealt(d => d < 5 ? d + 1 : 0), 600);
    return () => clearInterval(i);
  }, []);
  const suits = ["♠", "♥", "♦", "♣", "♠"];
  const values = ["A", "K", "Q", "J", "10"];
  return (
    <div className="flex items-center justify-center gap-1 py-3">
      {suits.map((s, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, rotateY: 180, x: -20 }}
          animate={{
            opacity: idx < dealt ? 1 : 0,
            rotateY: idx < dealt ? 0 : 180,
            x: 0,
          }}
          transition={{ duration: 0.4, delay: idx * 0.05 }}
          className="w-8 h-11 rounded bg-foreground/90 flex flex-col items-center justify-center text-background"
        >
          <span className="text-[10px] font-bold">{values[idx]}</span>
          <span className={`text-xs ${s === "♥" || s === "♦" ? "text-red-500" : ""}`}>{s}</span>
        </motion.div>
      ))}
    </div>
  );
};

export const CricketPreview = () => {
  const [score, setScore] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setScore(s => s < 186 ? s + Math.floor(Math.random() * 6) + 1 : 0), 700);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <div className="text-center">
        <div className="text-xs text-muted-foreground">IND</div>
        <motion.div
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="font-display font-bold text-lg text-primary"
        >
          {score}/4
        </motion.div>
      </div>
      <div className="text-muted-foreground text-xs">vs</div>
      <div className="text-center">
        <div className="text-xs text-muted-foreground">AUS</div>
        <div className="font-display font-bold text-lg text-foreground">186/10</div>
      </div>
    </div>
  );
};

export const IPLPreview = () => {
  const teams = ["CSK", "MI", "RCB", "KKR", "DC"];
  const teamColors = ["#fbbf24", "#004ba0", "#e11d48", "#3b0764", "#004c93"];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setIdx(x => (x + 1) % teams.length), 1500);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {teams.map((t, i) => (
        <motion.div
          key={t}
          animate={{
            scale: idx === i ? 1.3 : 0.75,
            opacity: idx === i ? 1 : 0.3,
          }}
          transition={{ duration: 0.4 }}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[9px] font-display font-bold text-white"
          style={{ background: teamColors[i] }}
        >
          {t}
        </motion.div>
      ))}
    </div>
  );
};

export const FantasyPreview = () => {
  const [pts, setPts] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setPts(p => p < 350 ? p + Math.floor(Math.random() * 30) + 10 : 0), 900);
    return () => clearInterval(i);
  }, []);
  return (
    <div className="flex items-center justify-center gap-3 py-3">
      <div className="text-center">
        <div className="text-[10px] text-muted-foreground">My Team</div>
        <motion.div key={pts} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="font-display font-bold text-lg text-primary">
          {pts} pts
        </motion.div>
      </div>
      <div className="flex -space-x-1">
        {["👑","⭐","🏏","🏏","🏏"].map((e, i) => (
          <motion.div key={i} animate={{ y: [0, -3, 0] }} transition={{ delay: i * 0.15, repeat: Infinity, duration: 1.5 }} className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px]">
            {e}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const previewMap: Record<string, React.FC> = {
  color_trading: ColorTradingPreview,
  ball_pool: BallPoolPreview,
  rummy: RummyPreview,
  motm: CricketPreview,
  ipl_prediction: IPLPreview,
  fantasy: FantasyPreview,
};
