"use client";

import { LayoutGroup, motion } from "motion/react";
import { TextRotate } from "@/components/ui/text-rotate";

const SPRING = { type: "spring", damping: 30, stiffness: 400 } as const;

/**
 * Hero headline: "Growth marketing" / "for AI-native <rotating word>", the word
 * in an ink pill. Line two is one non-wrapping flex row; "for AI-native" glides on a
 * layout spring as the rotating word changes width (the TextRotate demo pattern).
 */
export default function HeroHeadline({ className = "", lineClassName = "" }: { className?: string; lineClassName?: string }) {
  return (
    <h1 className={className}>
      <span className={`block ${lineClassName}`} style={{ animationDelay: "0.1s" }}>
        Growth marketing
      </span>
      <LayoutGroup>
        <motion.span className={`flex items-center whitespace-pre ${lineClassName}`} style={{ animationDelay: "0.25s" }} layout>
          <motion.span layout transition={SPRING}>
            for AI-native{" "}
          </motion.span>
          <TextRotate
            texts={["dev tools", "APIs", "AI agents", "platforms"]}
            mainClassName="overflow-hidden justify-center rounded-full bg-foreground px-[0.45em] py-[0.08em] text-white [text-shadow:none]"
            staggerFrom="last"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-120%" }}
            staggerDuration={0.025}
            splitLevelClassName="overflow-hidden pb-[0.1em]"
            transition={SPRING}
            rotationInterval={2200}
          />
        </motion.span>
      </LayoutGroup>
    </h1>
  );
}
