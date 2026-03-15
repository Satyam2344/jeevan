import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ShieldOff } from "lucide-react";

const GameDisabled = ({ title }: { title: string }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="container pt-24 pb-16 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <ShieldOff className="h-16 w-16 text-muted-foreground mb-4" />
      <h1 className="text-3xl font-display font-bold mb-2">{title} is Currently Disabled</h1>
      <p className="text-muted-foreground mb-6">This game has been temporarily disabled by the admin. Please check back later.</p>
      <Link to="/games">
        <Button className="gradient-primary text-primary-foreground font-display">Browse Other Games</Button>
      </Link>
    </div>
    <Footer />
  </div>
);

export default GameDisabled;
