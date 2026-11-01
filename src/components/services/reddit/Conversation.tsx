"use client";

import NumberFlow from "@number-flow/react";
import { ChevronDown, ChevronUp, MessageSquare, Share2 } from "lucide-react";
import { Mark } from "../parts";
import { useBeats } from "../search/scene";
import { STEPS } from "./content";

// 02 · Contribute with technical context: a real Reddit conversation, in Reddit's dark theme, nothing that looks
// like a tool. A question, and an answer that's useful first: a person who had the same problem says what
// worked, a sentence at a time, and the product turns up in the last sentence as part of how they solved it.
// The answer is upvoted, the thread line beside it draws down in green, and someone replies. No badges, no
// checklist; the only highlight is the product mention, and it's soft. Plays whenever this step is the active
// one. Reduced motion: the finished thread.
const C = STEPS.journey.conversation;
// 1 post · 2 the answer's header, and its votes · 3, 4 the first two sentences, 5 the third · 6 the product, highlighted, and the upvotes · 7 the reply
const TIMES = [200, 800, 1500, 2600, 3900, 5400, 6500];

const reveal = (on: boolean) => `transition-[opacity,filter] duration-[900ms] motion-reduce:transition-none ${on ? "opacity-100 blur-0" : "opacity-0 blur-[3px]"}`;
const fade = (on: boolean) => `transition-opacity duration-700 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`;

export default function Conversation({ on }: { on: boolean }) {
  const b = useBeats(on, TIMES);
  const a = C.answer;
  const MARK = "color-mix(in srgb, var(--primary) 34%, transparent)";

  return (
    <div className="w-full min-w-0 max-w-[34rem] overflow-hidden rounded-xl bg-[#141716] shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_30px_60px_-30px_rgb(0_0_0/0.75)]">
      {/* The post. */}
      <div className={`px-4 pt-4 pb-3.5 ${fade(b >= 1)}`}>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-white/45">
          <Mark name="reddit" className="size-5" />
          <span className="font-semibold text-white/85">{C.sub}</span>
          <span>·</span>
          <span>Posted by {C.post.user}</span>
          <span>{C.post.age}</span>
        </p>
        <p className="mt-2.5 text-[15px] leading-snug font-medium tracking-[-0.01em] text-white/95">{C.question}</p>
        <p className="mt-3 flex items-center gap-2 text-[11.5px] text-white/50">
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1">
            <ChevronUp className="size-3.5" strokeWidth={2.4} />
            <span className="font-semibold text-white/80">{C.post.score}</span>
            <ChevronDown className="size-3.5" strokeWidth={2.4} />
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1">
            <MessageSquare className="size-3.5" strokeWidth={2} />
            {C.post.comments} comments
          </span>
          <span className="flex items-center gap-1.5 px-1.5 py-1">
            <Share2 className="size-3.5" strokeWidth={2} />
            Share
          </span>
        </p>
      </div>

      {/* The answer: avatar and thread line on the left, the words on the right. */}
      <div className="flex gap-3 border-t border-white/[0.08] px-4 pt-4 pb-4">
        <div className={`flex w-7 shrink-0 flex-col items-center ${fade(b >= 2)}`}>
          <span className="grid size-7 place-items-center rounded-full bg-[linear-gradient(135deg,#2f3633,#1f2523)] text-[11px] font-semibold text-white/70">E</span>
          <span aria-hidden="true" className="relative mt-2 w-0.5 flex-1 rounded-full bg-white/10">
            <span className={`absolute inset-0 origin-top rounded-full bg-primary transition-transform duration-[1800ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${b >= 6 ? "scale-y-100" : "scale-y-0"}`} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className={`flex items-center gap-2 text-[11.5px] ${fade(b >= 2)}`}>
            <span className="font-semibold text-white/85">{a.user}</span>
            <span className="text-white/35">{a.age}</span>
          </p>
          <p className="mt-1.5 text-[13px] leading-[1.6] text-white/75">
            <span className={reveal(b >= 3)}>{a.sentences[0]} </span>
            <span className={reveal(b >= 4)}>{a.sentences[1]} </span>
            <span className={reveal(b >= 5)}>{a.sentences[2]} </span>
            <span className={reveal(b >= 6)}>
              <span
                style={{
                  backgroundImage: `linear-gradient(${MARK}, ${MARK})`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "0 100%",
                  backgroundSize: b >= 6 ? "100% 55%" : "0% 55%",
                  transitionDelay: b >= 6 ? "500ms" : "0ms",
                }}
                className="box-decoration-clone rounded-[3px] px-[2px] font-medium text-white transition-[background-size] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
              >
                {a.product}
              </span>
              {a.productRest}
            </span>
          </p>
          <p className={`mt-3 flex items-center gap-4 text-[11.5px] text-white/45 ${fade(b >= 2)}`}>
            <span className="flex items-center gap-1.5">
              <ChevronUp className={`size-4 transition-[color,translate] duration-500 ${b >= 6 ? "-translate-y-0.5 text-[#ff4500]" : ""}`} strokeWidth={2.4} />
              <span className="font-semibold text-white/85 tabular-nums">
                <NumberFlow value={b >= 6 ? a.votes : 1} />
              </span>
              <ChevronDown className="size-4" strokeWidth={2.4} />
            </span>
            <span>Reply</span>
            <span>Share</span>
          </p>

          {/* Someone replies. */}
          <div className={`mt-3.5 flex gap-2.5 transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${b >= 7 ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
            <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#34302b,#242120)] text-[10px] font-semibold text-white/60">P</span>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold text-white/80">{C.reply.user}</span>
                <span className="text-white/35">1h</span>
              </p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-white/70">{C.reply.text}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
