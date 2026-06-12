import type { WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";

export const nodeRealtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;
