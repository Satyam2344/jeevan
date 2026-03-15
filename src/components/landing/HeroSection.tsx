import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-background/80" />
      <div className="absolute inset-0 bg-grid opacity-20" />

      <div className="container relative z-10 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8"
          >
            <Zap className="h-4 w-4" />
            Live Games & Predictions
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
            <span className="text-foreground">Play. </span>
            <span className="text-primary text-glow">Predict. </span>
            <span className="text-foreground">Win.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Experience skill-based gaming and sports predictions on India's most secure
            and thrilling online gaming platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/games">
              <Button size="lg" className="gradient-primary text-primary-foreground font-display tracking-wider box-glow px-8">
                Start Playing
              </Button>
            </Link>
            <Link to="/wallet">
              <Button size="lg" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10 font-display tracking-wider px-8">
                View Wallet
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { icon: Zap, label: "Real-Time Games", value: "5+ Modules" },
              { icon: Trophy, label: "Tournaments", value: "Daily" },
              { icon: Shield, label: "Secure & Fair", value: "RNG Certified" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
              >
                <stat.icon className="h-5 w-5 text-primary" />
                <span className="font-display text-lg font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
