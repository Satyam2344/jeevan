import { motion } from "framer-motion";
import { Shield, Wallet, Users, BarChart3, Lock, Smartphone } from "lucide-react";

const features = [
  { icon: Shield, title: "Anti-Cheat Engine", desc: "Server-side validation with certified RNG for fair gameplay" },
  { icon: Wallet, title: "Secure Wallet", desc: "Deposit, withdraw, and track all transactions securely" },
  { icon: Users, title: "Referral System", desc: "Earn bonus credits by inviting friends to the platform" },
  { icon: BarChart3, title: "Live Analytics", desc: "Real-time game stats, revenue reports, and player insights" },
  { icon: Lock, title: "KYC & Compliance", desc: "Age verification, AML, and responsible gaming policies" },
  { icon: Smartphone, title: "Cross-Platform", desc: "Seamless experience across web and mobile devices" },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-secondary/30 relative">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
            Platform <span className="text-accent text-glow-purple">Features</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Enterprise-grade security and features built for scale
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-all"
            >
              <f.icon className="h-8 w-8 text-accent mb-3" />
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
