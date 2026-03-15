import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useGameActive = (gameType: string) => {
  const [isActive, setIsActive] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("game_configs")
      .select("is_active")
      .eq("game_type", gameType)
      .single()
      .then(({ data }) => {
        setIsActive(data?.is_active ?? false);
        setLoading(false);
      });
  }, [gameType]);

  return { isActive, loading };
};
