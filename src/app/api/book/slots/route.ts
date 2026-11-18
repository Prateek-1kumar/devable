import { DURATION_MIN, getSlots, isTimeZone } from "@/lib/booking";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

// GET /api/book/slots?start=YYYY-MM-DD&end=YYYY-MM-DD&tz=Area/City → { slots, duration }
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const start = q.get("start") ?? "";
  const end = q.get("end") ?? "";
  const tz = q.get("tz") ?? "";
  if (!DAY.test(start) || !DAY.test(end) || start > end || !isTimeZone(tz)) {
    return Response.json({ error: "Bad range or time zone." }, { status: 400 });
  }
  try {
    return Response.json({ slots: await getSlots(start, end, tz), duration: DURATION_MIN });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Couldn't load availability." }, { status: 502 });
  }
}
