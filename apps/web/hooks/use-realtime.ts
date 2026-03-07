"use client";

import { useEffect } from "react";

import { createRealtimeClient } from "@/lib/supabase";

export function useRealtimeChannel(channel: string, onEvent: (payload: unknown) => void) {
  useEffect(() => {
    const client = createRealtimeClient();
    if (!client) {
      return;
    }

    const subscription = client
      .channel(channel)
      .on("postgres_changes", { event: "*", schema: "public" }, (payload) => onEvent(payload))
      .subscribe();

    return () => {
      client.removeChannel(subscription);
    };
  }, [channel, onEvent]);
}
