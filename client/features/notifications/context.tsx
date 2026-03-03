"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

type NotificationContextValue = {
  newResponseCount: number;
  clearNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [newResponseCount, setNewResponseCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("hotel_responses_inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hotel_responses" },
        () => {
          setNewResponseCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const clearNotifications = useCallback(() => {
    setNewResponseCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{ newResponseCount, clearNotifications }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
