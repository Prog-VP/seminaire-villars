"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type NotificationItem = {
  id: string;
  type: "hotel_response";
  hotelName: string;
  respondentName?: string;
  offerId: string;
  offerLabel?: string;
  message: string;
  createdAt: string;
  isRead: boolean;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  clearNotifications: () => void;
  markAsRead: (id: string) => void;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  hasMore: boolean;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const PAGE_SIZE = 30;

function mapRows(data: Record<string, unknown>[]): NotificationItem[] {
  return data.map((r) => {
    const offer = r.offers as Record<string, string> | null;
    return {
      id: r.id as string,
      type: "hotel_response" as const,
      hotelName: r.hotelName as string,
      respondentName: r.respondentName as string | undefined,
      offerId: r.offer_id as string,
      offerLabel: offer
        ? [offer.numeroOffre, offer.societeContact].filter(Boolean).join(" — ")
        : undefined,
      message: r.message as string,
      createdAt: r.createdAt as string,
      isRead: (r.is_read as boolean) ?? false,
    };
  });
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  // Fetch initial batch + realtime
  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data } = await supabase
        .from("hotel_responses")
        .select("id, hotelName, respondentName, message, createdAt, offer_id, is_read, offers(societeContact, numeroOffre)")
        .order("createdAt", { ascending: false })
        .range(0, PAGE_SIZE - 1);

      if (data) {
        const items = mapRows(data);
        setNotifications(items);
        offsetRef.current = items.length;
        setHasMore(items.length === PAGE_SIZE);
      }
    })();

    // Listen for new responses in real-time
    const channel = supabase
      .channel("hotel_responses_inserts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "hotel_responses" },
        async (payload) => {
          const row = payload.new as Record<string, unknown>;

          let offerLabel: string | undefined;
          const { data: offerData } = await supabase
            .from("offers")
            .select("societeContact, numeroOffre")
            .eq("id", row.offer_id)
            .single();
          if (offerData) {
            offerLabel = [offerData.numeroOffre, offerData.societeContact]
              .filter(Boolean)
              .join(" — ");
          }

          const item: NotificationItem = {
            id: row.id as string,
            type: "hotel_response",
            hotelName: row.hotelName as string,
            respondentName: row.respondentName as string | undefined,
            offerId: row.offer_id as string,
            offerLabel,
            message: row.message as string,
            createdAt: row.createdAt as string,
            isRead: false,
          };

          setNotifications((prev) => [item, ...prev]);
          offsetRef.current += 1;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const supabase = createClient();
      const from = offsetRef.current;
      const to = from + PAGE_SIZE - 1;

      const { data } = await supabase
        .from("hotel_responses")
        .select("id, hotelName, respondentName, message, createdAt, offer_id, is_read, offers(societeContact, numeroOffre)")
        .order("createdAt", { ascending: false })
        .range(from, to);

      if (data) {
        const items = mapRows(data);
        setNotifications((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = items.filter((n) => !existingIds.has(n.id));
          return [...prev, ...newItems];
        });
        offsetRef.current = from + items.length;
        setHasMore(items.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const clearNotifications = useCallback(() => {
    setNotifications((prev) => {
      const unreadIds = prev.filter((n) => !n.isRead).map((n) => n.id);
      if (unreadIds.length === 0) return prev;
      const supabase = createClient();
      void supabase
        .from("hotel_responses")
        .update({ is_read: true })
        .in("id", unreadIds)
        .then();
      return prev.map((n) => (n.isRead ? n : { ...n, isRead: true }));
    });
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    const supabase = createClient();
    void supabase
      .from("hotel_responses")
      .update({ is_read: true })
      .eq("id", id)
      .then();
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, unreadCount, clearNotifications, markAsRead, loadMore, loadingMore, hasMore }),
    [notifications, unreadCount, clearNotifications, markAsRead, loadMore, loadingMore, hasMore]
  );

  return (
    <NotificationContext.Provider value={value}>
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
