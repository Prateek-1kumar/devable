"use client";

import type { CSSProperties, ReactNode } from "react";
import { CHANNELS } from "./growth-engine/channels";
import { channelFocus } from "./growth-engine/channelFocus";

/** A channel name in the sentence: hovering or focusing it lifts and lights its 3D layer, underlined in its color. */
function Channel({ index, children }: { index: number; children: ReactNode }) {
  return (
    <span
      tabIndex={0}
      onPointerEnter={() => channelFocus.set(index)}
      onPointerLeave={() => channelFocus.set(null)}
      onFocus={() => channelFocus.set(index)}
      onBlur={() => channelFocus.set(null)}
      style={{ "--channel": CHANNELS[index].color } as CSSProperties}
      className="cursor-default rounded-sm text-foreground/80 underline decoration-transparent decoration-2 underline-offset-[5px] transition-colors hover:text-foreground hover:decoration-(--channel) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--channel)"
    >
      {children}
    </span>
  );
}

/** The hero sentence, with each channel linked to its layer in the growth engine. */
export default function ChannelParagraph({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <p className={className} style={style}>
      We build visibility and pipeline through <Channel index={0}>technical content</Channel>,{" "}
      <Channel index={1}>organic search</Channel>, <Channel index={1}>AI visibility</Channel>,{" "}
      <Channel index={2}>Reddit</Channel>, and <Channel index={3}>creator distribution</Channel>.
    </p>
  );
}
