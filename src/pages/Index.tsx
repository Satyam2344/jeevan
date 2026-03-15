import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import GameModules from "@/components/landing/GameModules";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <GameModules />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
