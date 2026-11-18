// Server only (it reads CAL_API_KEY): import it from route handlers, never from a client component.
//
// The Book a Call page's one door to a calendar. With CAL_API_KEY and CAL_EVENT_TYPE_ID set it reads free slots from
// and books through Cal.com (API v2), which syncs Sumanth's Google Calendar, sends the invites and adds the video
// link. Without them it serves deterministic mock slots so the page can be built and reviewed; bookings made then
// are not real, and the page says so.

export const DURATION_MIN = 30;

/** Free slot start times (ISO instants), grouped by calendar day (YYYY-MM-DD) in the visitor's time zone. */
export type Slots = Record<string, string[]>;
export type BookingInput = { start: string; name: string; email: string; company: string; notes: string; timeZone: string };
export type Booking = { uid: string; start: string; end: string; mock: boolean };

export class SlotTakenError extends Error {}

const CAL = "https://api.cal.com/v2";
const key = process.env.CAL_API_KEY;
const eventTypeId = Number(process.env.CAL_EVENT_TYPE_ID);
const live = Boolean(key && eventTypeId);

/** The calendar day an instant falls on in a time zone, as YYYY-MM-DD. */
export function dayKey(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(instant);
}

export function isTimeZone(tz: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function group(starts: string[], timeZone: string): Slots {
  const out: Slots = {};
  for (const s of starts.sort()) (out[dayKey(new Date(s), timeZone)] ??= []).push(s);
  return out;
}

/** Free slots for the calendar days `start`..`end` (inclusive, YYYY-MM-DD) as seen in `timeZone`. */
export async function getSlots(start: string, end: string, timeZone: string): Promise<Slots> {
  if (!live) return mockSlots(start, end, timeZone);
  const params = new URLSearchParams({ eventTypeId: String(eventTypeId), start, end, timeZone });
  const res = await fetch(`${CAL}/slots?${params}`, {
    headers: { Authorization: `Bearer ${key}`, "cal-api-version": "2024-09-04" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cal.com slots ${res.status}`);
  const { data } = (await res.json()) as { data: Record<string, { start: string }[]> };
  return group(Object.values(data).flatMap((day) => day.map((s) => s.start)), timeZone);
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  if (!live) {
    const start = new Date(input.start);
    return { uid: "preview", start: start.toISOString(), end: new Date(+start + DURATION_MIN * 60_000).toISOString(), mock: true };
  }
  const res = await fetch(`${CAL}/bookings`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "cal-api-version": "2024-08-13", "Content-Type": "application/json" },
    body: JSON.stringify({
      start: new Date(input.start).toISOString(),
      eventTypeId,
      attendee: { name: input.name, email: input.email, timeZone: input.timeZone },
      // `notes` is Cal.com's default "Additional notes" field, so the company shows on the invite without a custom field.
      bookingFieldsResponses: { notes: [`Company: ${input.company}`, input.notes].filter(Boolean).join("\n\n") },
      metadata: { company: input.company.slice(0, 500), source: "devable.ai/book" },
    }),
    cache: "no-store",
  });
  if (res.status === 400 || res.status === 409) throw new SlotTakenError();
  if (!res.ok) throw new Error(`Cal.com booking ${res.status}`);
  const { data } = (await res.json()) as { data: { uid: string; start: string; end: string } };
  return { uid: data.uid, start: data.start, end: data.end, mock: false };
}

// Mock availability: Sumanth's weekdays in IST, 10:00 to 18:00, with about a third of the slots taken (the same ones on
// every load) and nothing sooner than four hours out.
const IST_OFFSET_MIN = 330;
function mockSlots(start: string, end: string, timeZone: string): Slots {
  const from = Date.parse(`${start}T00:00:00Z`) - 86_400_000; // a day either side covers every time zone's edges
  const to = Date.parse(`${end}T00:00:00Z`) + 2 * 86_400_000;
  const earliest = Date.now() + 4 * 3_600_000;
  const starts: string[] = [];
  for (let day = from; day <= to; day += 86_400_000) {
    const weekday = new Date(day).getUTCDay();
    if (weekday === 0 || weekday === 6) continue;
    for (let m = 10 * 60; m < 18 * 60; m += DURATION_MIN) {
      const at = day + (m - IST_OFFSET_MIN) * 60_000;
      if (at < earliest || hash(`${day}:${m}`) % 10 < 3) continue;
      starts.push(new Date(at).toISOString());
    }
  }
  const slots = group(starts, timeZone);
  return Object.fromEntries(Object.entries(slots).filter(([d]) => d >= start && d <= end));
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
