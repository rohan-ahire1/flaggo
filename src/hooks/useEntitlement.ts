import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { supabase } from "../lib/supabase";

export function useEntitlement() {
  const { user } = useAuth();
  const [adsRemoved, setAdsRemoved] = useState(false);
  const [loading, setLoading] = useState(false);

  const refetch = useCallback(async () => {
    const client = supabase;
    if (!user || !client) {
      setAdsRemoved(false);
      return false;
    }
    setLoading(true);
    const { data } = await client.from("entitlements").select("ads_removed").eq("user_id", user.id).maybeSingle();
    const next = Boolean(data?.ads_removed);
    setAdsRemoved(next);
    setLoading(false);
    return next;
  }, [user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    const client = supabase;
    if (!user || !client) return;
    const channel = client
      .channel(`entitlement:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "entitlements", filter: `user_id=eq.${user.id}` }, (payload) => {
        setAdsRemoved(Boolean((payload.new as { ads_removed?: boolean }).ads_removed));
      })
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [user]);

  return { adsRemoved, loading, refetch };
}
