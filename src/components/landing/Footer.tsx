import logo from "@/assets/jeevan_logo.jpeg";

const Footer = () => (
  <footer className="border-t border-border/50 bg-background py-12">
    <div className="container">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="JEEVAN Logo" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-display text-sm font-bold tracking-wider text-primary">JEEVAN</span>
        </div>
        <p className="text-sm text-muted-foreground">
          © 2026 JEEVAN. Skill-based gaming platform. Play responsibly.
        </p>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <a href="#" className="hover:text-primary transition-colors">Support</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
