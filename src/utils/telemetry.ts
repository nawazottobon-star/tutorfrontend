import { buildApiUrl } from "@/lib/api";

type TelemetryEvent = {
  courseId: string;
  moduleNo?: number | null;
  topicId?: string | null;
  eventType: string;
  payload?: Record<string, unknown>;
  occurredAt?: string;
};

const BUFFER_FLUSH_INTERVAL_MS = 4000;
const MAX_BUFFER_SIZE = 20;

let currentToken: string | null = null;
let buffer: TelemetryEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

const isBrowser = typeof window !== "undefined";

async function flushBuffer(): Promise<void> {
  if (!currentToken || buffer.length === 0) {
    return;
  }
  const events = buffer.slice();
  buffer = [];
  try {
    await fetch(buildApiUrl("/api/activity/events"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ events: events.map((event) => ({ ...event, occurredAt: event.occurredAt ?? new Date().toISOString() })) }),
    });
  } catch (error) {
    console.warn("Failed to send telemetry events", error);
  }
}

function scheduleFlush(): void {
  if (flushTimer || !isBrowser) {
    return;
  }
  flushTimer = window.setTimeout(() => {
    flushTimer = null;
    void flushBuffer();
  }, BUFFER_FLUSH_INTERVAL_MS);
}

export function updateTelemetryAccessToken(token: string | null): void {
  currentToken = token ?? null;
  if (!currentToken) {
    buffer = [];
    if (flushTimer) {
      window.clearTimeout(flushTimer);
      flushTimer = null;
    }
  }
}

export function recordTelemetryEvent(event: TelemetryEvent): void {
  if (!currentToken || !isBrowser) {
    return;
  }
  buffer.push(event);
  if (buffer.length >= MAX_BUFFER_SIZE) {
    void flushBuffer();
    return;
  }
  scheduleFlush();
}
