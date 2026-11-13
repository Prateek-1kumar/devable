"use client";

import NumberFlow from "@number-flow/react";
import { ArrowBigDown, ArrowBigUp, Ellipsis, MessageSquare, Share } from "lucide-react";
import { Mark } from "../parts";
import { PANEL, show, useBeats } from "../search/scene";
import { STEPS } from "./content";
import { Avatar } from "./Hero";

// 02 · Contribute with technical context: a real Reddit thread, on the light theme, nothing that looks like a tool.
// A question that has 48 comments; two neighbouring comments are only shapes, because they are not the point. The
// one that matters is a reply from someone who has solved it: it says what worked, and the product turns up in its
// first sentence as part of how they solved it. As it is read the reply settles onto a faint green panel, the thread
// line beside it draws down in green and bends into its vote row, the product is picked out softly, and the reply is
// upvoted. No badges, no checklist. Plays whenever this step is the active one. Reduced motion: the finished thread.
const C = STEPS.journey.conversation;
// 1 post · 2 the comment above · 3 the reply, its header and first line · 4 the rest of it · 5 the product picked out, the panel, the green line · 6 upvoted · 7 the comment below
const TIMES = [200, 800, 1500, 2500, 3700, 4900, 5900];

const reveal = (on: boolean) => `transition-[opacity,filter] duration-[900ms] motion-reduce:transition-none ${on ? "opacity-100 blur-0" : "opacity-0 blur-[3px]"}`;
const fade = (on: boolean) => `transition-opacity duration-700 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`;
const BAR = "block h-2.5 rounded-full bg-ink/[0.07]";

export default function Conversation({ on }: { on: boolean }) {
  const b = useBeats(on, TIMES);
  const a = C.answer;
  const lit = b >= 5;

  return (
    <div className="w-full max-w-[34rem] min-w-0">
      <div className={`${PANEL} overflow-hidden rounded-2xl px-4 py-4 sm:px-5 sm:py-5 ${show(b >= 1)}`}>
        {/* The post: its vote column on the left, as on a thread page. */}
        <div className="flex gap-3">
          <div className="hidden w-7 shrink-0 flex-col items-center gap-0.5 pt-10 text-ink/55 sm:flex">
            <ArrowBigUp className="size-5" strokeWidth={1.6} />
            <span className="text-[12.5px] font-semibold text-ink tabular-nums">{C.post.score}</span>
            <ArrowBigDown className="size-5" strokeWidth={1.6} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5">
              <Mark name="reddit" className="size-9" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="text-[13px] font-semibold text-ink">{C.sub}</p>
                <p className="mt-0.5 text-[11.5px] text-ink/50">
                  Posted by {C.post.user} {C.post.age}
                </p>
              </div>
              <span className="rounded-full border border-ink/15 px-3.5 py-1 text-[12px] font-semibold text-ink">Join</span>
              <Ellipsis className="size-4 text-ink/40" />
            </div>
            <p className="mt-3.5 text-[17px] leading-snug font-semibold tracking-[-0.015em] text-ink">{C.question}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-ink/60">
              <span className="rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,white)] px-3 py-1 text-[#1a7f47]">{C.post.tags[0]}</span>
              <span className="rounded-full bg-ink/[0.05] px-3 py-1 text-ink/65">{C.post.tags[1]}</span>
              <span className="ml-1 inline-flex items-center gap-1.5 px-1.5 py-1">
                <MessageSquare className="size-3.5" strokeWidth={1.8} />
                {C.post.comments} comments
              </span>
              <span className="inline-flex items-center gap-1.5 px-1.5 py-1">
                <Share className="size-3.5" strokeWidth={1.8} />
                Share
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-ink/[0.07] pt-4">
          {/* A neighbouring comment (only shapes, it isn't the point) and the reply that matters, nested under it. */}
          <div className="relative">
            {/* The thread line down from the comment's avatar, bending into the reply's vote row: grey, then drawn over in green. */}
            <span aria-hidden="true" className="absolute top-9 bottom-[2.1rem] left-[13px] w-px bg-ink/[0.1]" />
            <span aria-hidden="true" className="absolute bottom-[2.1rem] left-[13px] h-3.5 w-[1.4rem] translate-y-3.5 rounded-bl-[10px] border-b border-l border-ink/[0.1]" />
            <span
              aria-hidden="true"
              className={`absolute top-9 bottom-[calc(2.1rem-14px)] left-[13px] w-[1.5px] origin-top transition-transform duration-[1600ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none ${lit ? "scale-y-100" : "scale-y-0"}`}
            >
              <span className="absolute inset-x-0 top-0 bottom-3.5 bg-primary" />
              <span className="absolute bottom-0 left-0 h-3.5 w-[1.4rem] rounded-bl-[10px] border-b-[1.5px] border-l-[1.5px] border-primary" />
            </span>
            <Neighbour who={C.above} n={1} show={b >= 2} />
            <div className="mt-3 ml-9">
              <div className={`rounded-xl px-3.5 py-3 transition-[background-color,box-shadow] duration-1000 motion-reduce:transition-none ${lit ? "bg-[color-mix(in_srgb,var(--primary)_7%,white)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--primary)_16%,transparent)]" : ""}`}>
                <div className={`flex gap-2.5 ${fade(b >= 3)}`}>
                  <Avatar n={4} className="size-7" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 text-[12px] text-ink/55">
                      <span className="font-semibold text-ink">{a.user}</span>
                      <span>{a.age}</span>
                    </p>
                    <p className="mt-1.5 text-[13.5px] leading-[1.6] text-ink/85">
                      <span className={reveal(b >= 3)}>
                        {a.before}
                        <span
                          style={{ backgroundSize: lit ? "100% 100%" : "0% 100%", transitionDelay: lit ? "500ms" : "0ms" }}
                          className="box-decoration-clone rounded-[4px] bg-[linear-gradient(color-mix(in_srgb,var(--primary)_26%,white),color-mix(in_srgb,var(--primary)_26%,white))] [background-position:0_100%] bg-no-repeat px-1 py-0.5 font-medium text-ink transition-[background-size] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none"
                        >
                          {a.product}
                        </span>
                      </span>
                      <span className={reveal(b >= 4)}>{a.after}</span>
                    </p>
                    <div className={`mt-2.5 -ml-1 flex flex-wrap items-center gap-0.5 text-[12px] font-semibold text-ink/55 ${fade(b >= 3)}`}>
                      <span className="inline-flex items-center gap-0.5 px-1">
                        <ArrowBigUp className={`size-[18px] transition-colors duration-500 ${b >= 6 ? "fill-[#ff4500] text-[#ff4500]" : ""}`} strokeWidth={1.8} />
                        <span className={`px-0.5 tabular-nums transition-colors duration-500 ${b >= 6 ? "text-[#ff4500]" : "text-ink"}`}>
                          <NumberFlow value={b >= 6 ? a.votes : 1} />
                        </span>
                        <ArrowBigDown className="size-[18px]" strokeWidth={1.8} />
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1">
                        <MessageSquare className="size-3.5" strokeWidth={1.8} />
                        Reply
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-1">
                        <Share className="size-3.5" strokeWidth={1.8} />
                        Share
                      </span>
                      <Ellipsis className="size-4 text-ink/40" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* And another, below. */}
          <div className="mt-3">
            <Neighbour who={C.below} n={3} show={b >= 7} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** A comment drawn only as its author, two lines of grey and its vote row: there to give the reply a thread to sit in. */
function Neighbour({ who, n, show: shown }: { who: { user: string; age: string; votes: number }; n: number; show: boolean }) {
  return (
    <div className={`flex gap-2.5 ${fade(shown)}`}>
      <Avatar n={n} className="size-7" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-[12px] text-ink/55">
          <span className="font-semibold text-ink">{who.user}</span>
          <span>{who.age}</span>
        </p>
        <div className="mt-2 space-y-2">
          <span className={`${BAR} w-[88%]`} />
          <span className={`${BAR} w-[62%]`} />
        </div>
        <div className="mt-2.5 -ml-1 flex items-center gap-1 text-[12px] font-semibold text-ink/50">
          <span className="inline-flex items-center gap-0.5 px-1">
            <ArrowBigUp className="size-[18px]" strokeWidth={1.8} />
            <span className="px-0.5 tabular-nums">{who.votes}</span>
            <ArrowBigDown className="size-[18px]" strokeWidth={1.8} />
          </span>
          <MessageSquare className="mx-2 size-3.5" strokeWidth={1.8} />
          <Share className="mx-2 size-3.5" strokeWidth={1.8} />
          <Ellipsis className="size-4 text-ink/40" />
        </div>
      </div>
    </div>
  );
}
