import { createBooking, isTimeZone, SlotTakenError } from "@/lib/booking";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// POST /api/book { start, name, email, company, notes, timeZone, website } → { booking }
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });

  // `website` is a field people never see; only bots fill it in. Answer as if it worked.
  if (text(body.website, 200)) return Response.json({ booking: { uid: "ok", start: body.start, end: body.start, mock: true } });

  const input = {
    start: text(body.start, 40),
    name: text(body.name, 120),
    email: text(body.email, 200),
    company: text(body.company, 160),
    notes: text(body.notes, 1500),
    timeZone: text(body.timeZone, 64),
  };
  const when = Date.parse(input.start);
  if (!input.name || !EMAIL.test(input.email) || !input.company || Number.isNaN(when) || when < Date.now() || !isTimeZone(input.timeZone)) {
    return Response.json({ error: "Please check your details and try again." }, { status: 400 });
  }

  try {
    return Response.json({ booking: await createBooking(input) });
  } catch (e) {
    if (e instanceof SlotTakenError) {
      return Response.json({ error: "That time was just taken. Please pick another.", taken: true }, { status: 409 });
    }
    console.error(e);
    return Response.json({ error: "Something went wrong on our side. Please try again." }, { status: 502 });
  }
}
