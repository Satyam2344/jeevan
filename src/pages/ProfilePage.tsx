import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Mail, Phone, Copy } from "lucide-react";
import { motion } from "framer-motion";

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone })
      .eq("user_id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated!");
    setEditing(false);
    refreshProfile();
  };

  const copyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      toast.success("Referral code copied!");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container pt-24 pb-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-8">
          My <span className="text-primary text-glow">Profile</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
            <Card className="gradient-card border-primary/30">
              <CardContent className="pt-6 text-center">
                <div className="h-20 w-20 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
                <h2 className="font-display text-lg font-bold text-foreground">{profile?.username || "Loading..."}</h2>
                <p className="text-sm text-muted-foreground mb-3">Member since {profile ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "..."}</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                  <span className="text-muted-foreground">Referral:</span>
                  <code className="text-primary font-mono">{profile?.referral_code}</code>
                  <button onClick={copyReferral}><Copy className="h-3 w-3 text-muted-foreground hover:text-primary" /></button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2">
            <Card className="gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="font-display text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <div className="flex items-center gap-3"><User className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Username</span></div>
                  <span className="text-sm font-medium text-foreground">{profile?.username}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border/30">
                  <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Email</span></div>
                  <span className="text-sm font-medium text-foreground">{profile?.email || user?.email}</span>
                </div>

                {editing ? (
                  <>
                    <div>
                      <label className="text-xs text-muted-foreground">Display Name</label>
                      <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="bg-secondary border-border mt-1" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Phone</label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-secondary border-border mt-1" />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveProfile} className="gradient-primary text-primary-foreground">Save</Button>
                      <Button variant="ghost" onClick={() => setEditing(false)} className="text-muted-foreground">Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">Display Name</span></div>
                      <span className="text-sm text-foreground">{profile?.display_name || "Not set"}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-border/30">
                      <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">Phone</span></div>
                      <span className="text-sm text-foreground">{profile?.phone || "Not set"}</span>
                    </div>
                    <Button variant="outline" onClick={() => setEditing(true)} className="w-full border-primary/40 text-primary hover:bg-primary/10">
                      Edit Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
