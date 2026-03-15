import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Wallet } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/jeevan_logo.jpeg";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="JEEVAN Logo" className="h-9 w-9 rounded-full object-cover" />
          <span className="font-display text-lg font-bold tracking-wider text-primary">JEEVAN</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/games" className="text-sm text-muted-foreground hover:text-primary transition-colors">Games</Link>
          {user && (
            <>
              <Link to="/wallet" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Wallet className="h-3 w-3" /> Wallet
              </Link>
              <Link to="/profile" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <User className="h-3 w-3" /> {profile?.username || "Profile"}
              </Link>
            </>
          )}
          <ThemeToggle />
          {isAdmin && (
            <Link to="/admin">
              <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-primary">Admin</Button>
            </Link>
          )}
          {user ? (
            <Button size="sm" variant="outline" onClick={handleSignOut} className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="h-3 w-3 mr-1" /> Logout
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="gradient-primary text-primary-foreground">Sign In</Button>
            </Link>
          )}
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl p-4 space-y-3">
          <Link to="/games" className="block text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>Games</Link>
          {user && (
            <>
              <Link to="/wallet" className="block text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>Wallet</Link>
              <Link to="/profile" className="block text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>Profile</Link>
            </>
          )}
          {isAdmin && <Link to="/admin" className="block text-sm text-muted-foreground hover:text-primary" onClick={() => setOpen(false)}>Admin Panel</Link>}
          <ThemeToggle />
          {user ? (
            <Button size="sm" variant="outline" onClick={() => { handleSignOut(); setOpen(false); }} className="w-full border-destructive/50 text-destructive">Logout</Button>
          ) : (
            <Link to="/auth" className="block" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full gradient-primary text-primary-foreground">Sign In</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
