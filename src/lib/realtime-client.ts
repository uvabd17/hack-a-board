"use client"

import { createRealtime } from "@upstash/realtime/client"
import type { RealtimeEvents } from "./realtime"

// Typed `useRealtime` hook — import this in client components
export const { useRealtime } = createRealtime<RealtimeEvents>()
