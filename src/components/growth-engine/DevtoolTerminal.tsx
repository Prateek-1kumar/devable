import { useCallback, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { TERMINAL_CARD, TERMINAL_NODE, cardCenter } from "./layout";
import { palette } from "./palette";
import { CARD_PX, CardPlane, DESIGN_ZOOM } from "./parts";
import { useStory } from "./story";
import { useCanvasTexture } from "./useCanvasTexture";

// Where the signal starts: your devtool's terminal, a dark window pinned above
// its floor node. It types its command once, then reports each signal it sends.

const PROMPT = "npx your-devtool";
const TYPE_FROM = 0.15;
const TYPE_EVERY = 0.035; // seconds per character
const [W, H] = [TERMINAL_CARD.w, TERMINAL_CARD.h];

type View = { chars: number; cursor: boolean; sending: boolean };

export default function DevtoolTerminal() {
  const story = useStory();
  const p = palette();
  const view = useRef<View>({ chars: PROMPT.length, cursor: false, sending: false });
  const center = useMemo(() => cardCenter(TERMINAL_NODE, TERMINAL_CARD), []);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const { chars, cursor, sending } = view.current;
      const u = CARD_PX / DESIGN_ZOOM; // one screen pixel (at the design scale) in texture pixels
      const r = 9 * u;
      // Window.
      ctx.fillStyle = p.ink;
      ctx.beginPath();
      ctx.roundRect(u, u, w - 2 * u, h - 2 * u, r);
      ctx.fill();
      // Title bar: three quiet dots and the working directory.
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(14 * u + i * 11 * u, 14 * u, 3.2 * u, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.font = `500 ${8.6 * u}px ${p.monoFont}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.fillText("~/acme — zsh", w / 2, 14.5 * u);
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(u, 27 * u, w - 2 * u, u);

      const x = 13 * u;
      const line = (row: number) => 44 * u + row * 17 * u;
      ctx.font = `500 ${10.5 * u}px ${p.monoFont}`;
      // The command.
      ctx.fillStyle = p.accent;
      ctx.fillText("$", x, line(0));
      ctx.fillStyle = "#ffffff";
      const typed = PROMPT.slice(0, chars);
      ctx.fillText(typed, x + 12 * u, line(0));
      if (cursor) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(x + 12 * u + ctx.measureText(typed).width + 1.5 * u, line(0) - 6 * u, 5.5 * u, 12 * u);
      }
      if (chars < PROMPT.length) return;
      // Output: what the tool knows, then the live signal status.
      ctx.font = `500 ${9.6 * u}px ${p.monoFont}`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText("✓ docs indexed  214 pages", x, line(1));
      ctx.fillStyle = sending ? p.accent : "#7fb59a";
      ctx.beginPath();
      ctx.arc(x + 3.5 * u, line(2), 3.2 * u, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = sending ? "#ffffff" : "rgba(255,255,255,0.72)";
      ctx.fillText(sending ? "signal → 4 channels" : "listening for demand", x + 12 * u, line(2));
    },
    [p],
  );
  const screen = useCanvasTexture(Math.round(W * CARD_PX), Math.round(H * CARD_PX), draw);

  useFrame((state) => {
    const t = story.time(state.clock.elapsedTime);
    const chars = story.still ? PROMPT.length : Math.max(0, Math.min(PROMPT.length, Math.floor((t - TYPE_FROM) / TYPE_EVERY)));
    const next: View = { chars, cursor: chars < PROMPT.length && !story.still, sending: story.sending(t) };
    const v = view.current;
    if (next.chars !== v.chars || next.cursor !== v.cursor || next.sending !== v.sending) {
      view.current = next;
      screen.paint();
    }
  });

  return <CardPlane center={center} w={W} h={H} texture={screen.texture} />;
}
