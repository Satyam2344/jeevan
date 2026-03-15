import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminFraud = () => {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => { fetchAlerts(); }, []);

  const fetchAlerts = async () => {
    const { data } = await supabase.from("fraud_alerts").select("*").order("created_at", { ascending: false });
    setAlerts(data || []);
  };

  const updateAlert = async (id: string, status: string) => {
    await supabase.from("fraud_alerts").update({ status }).eq("id", id);
    toast.success(`Alert ${status}`);
    fetchAlerts();
  };

  return (
    <div>
      <h1 className="text-3xl font-display font-bold mb-6">Fraud <span className="text-neon-red">Detection</span></h1>
      <div className="space-y-4">
        {alerts.map(a => (
          <Card key={a.id} className={`gradient-card ${a.severity === "critical" ? "border-neon-red/50" : a.severity === "high" ? "border-neon-orange/50" : "border-border/50"}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`h-5 w-5 ${a.severity === "critical" ? "text-neon-red" : a.severity === "high" ? "text-neon-orange" : "text-gold"}`} />
                  <div>
                    <p className="font-display font-bold text-foreground">{a.alert_type}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <Badge className={`text-xs ${a.severity === "critical" ? "bg-neon-red/20 text-neon-red" : a.severity === "high" ? "bg-neon-orange/20 text-neon-orange" : "bg-gold/20 text-gold"}`}>
                  {a.severity} • {a.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{a.details}</p>
              {a.status === "open" && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-neon-orange/40 text-neon-orange hover:bg-neon-orange/10" onClick={() => updateAlert(a.id, "investigating")}>Investigate</Button>
                  <Button size="sm" variant="outline" className="border-primary/40 text-primary hover:bg-primary/10" onClick={() => updateAlert(a.id, "resolved")}>Resolve</Button>
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => updateAlert(a.id, "dismissed")}>Dismiss</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {alerts.length === 0 && <p className="text-sm text-muted-foreground">No fraud alerts. The system is clean!</p>}
      </div>
    </div>
  );
};

export default AdminFraud;
