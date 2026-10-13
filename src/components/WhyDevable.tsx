"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import logo from "../../public/brand/devable-logo.png";

const TITLE = "Developer growth is not the same as traditional marketing.";
const SUBTITLE = "Technical audiences do not respond to generic playbooks.";

const ROWS = [
  {
    label: "Product understanding",
    devable:
      "Understand the product, technology, and audience before execution",
    agency: "Learn the category and build campaigns around it",
  },
  {
    label: "Team",
    devable: "Engineers, technical writers, creators, and growth operators",
    agency: "General marketing specialists",
  },
  {
    label: "Audience",
    devable: "Built around developer trust and behavior",
    agency: "Built around broad audience patterns",
  },
  {
    label: "Discovery",
    devable:
      "Where developers discover products: search, AI, communities, and creators",
    agency: "Traditional marketing channels",
  },
  {
    label: "Content",
    devable: "Technical content developers trust",
    agency: "Content built around marketing objectives",
  },
  {
    label: "Execution",
    devable: "Strategy and execution handled by one embedded team",
    agency: "Requires more direction and management",
  },
  {
    label: "Measurement",
    devable: "Focus on visibility, audience growth, and business signals",
    agency: "Focus on deliverables and reporting",
  },
  {
    label: "Commitment",
    devable: "Flexible engagements without long-term lock-ins",
    agency: "Fixed retainers and longer commitments",
  },
];

const GREEN = "#1a7f47"; // deep green shared with the How We Work active-step marker

// A check in a soft green circle: the only green in the rows, kept gentle.
function Check() {
  return (
    <span
      aria-hidden="true"
      className="mt-[2px] grid size-[18px] shrink-0 place-items-center rounded-full bg-[#e3f3e8]"
    >
      <svg viewBox="0 0 16 16" className="size-3" style={{ color: GREEN }}>
        <path
          d="M3.5 8.5l3 3 6-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// The closing argument. A centered heading, then the table inset on its own on a borderless off-white
// surface. Devable's column is one white card floating on it (drawn behind the table so it reads as a
// single card, not eight cells), with the wordmark on top. No hard borders, only hairlines; the table
// fades in once and stays still.
// Below md the table un-tables: each row becomes a small stacked card with its own column labels.
export default function WhyDevable() {
  const frame = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      aria-labelledby="why-devable-title"
      className="px-6 pt-20 pb-28 sm:px-12 lg:pt-28 lg:pb-36 xl:px-[6vw]"
    >
      {/* Centered: "Why Devable" as the title, the two-tone claim beneath it. */}
      <header className="mx-auto max-w-[60rem] text-center">
        <h2
          id="why-devable-title"
          className="text-[clamp(2.25rem,3.6vw,3.25rem)] leading-[1.05] font-medium tracking-[-0.04em] text-ink"
        >
          Why <span className="text-primary">Devable</span>
        </h2>
        <p className="mt-5 text-[clamp(1.25rem,1.9vw,1.7rem)] leading-[1.25] tracking-[-0.025em] text-ink">
          {TITLE} <span className="block text-ink/45">{SUBTITLE}</span>
        </p>
      </header>

      <div
        ref={frame}
        className={`mx-auto mt-12 max-w-[68rem] md:rounded-3xl md:bg-[#f7f6f2] md:p-3 lg:mt-16 ${
          shown ? "animate-fade-up" : "opacity-0"
        } motion-reduce:animate-none motion-reduce:opacity-100`}
      >
        <div className="relative">
          {/* Devable card: sits under the middle column (columns are fixed at 24 / 42 / 34%). */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-[24%] w-[42%] rounded-2xl bg-white shadow-[0_1px_2px_rgb(23_44_33_/_0.04),0_12px_32px_-12px_rgb(23_44_33_/_0.12)] max-md:hidden"
          />

          <table className="relative w-full table-fixed border-collapse text-left max-md:block">
            <colgroup className="max-md:hidden">
              <col className="w-[24%]" />
              <col className="w-[42%]" />
              <col className="w-[34%]" />
            </colgroup>
            <thead className="max-md:hidden">
              <tr>
                <th scope="col" className="px-6 pt-8 pb-6">
                  <span className="sr-only">Topic</span>
                </th>
                <th scope="col" className="px-8 pt-8 pb-6 align-bottom">
                  <Image src={logo} alt="Devable" className="h-[22px] w-auto" />
                </th>
                <th
                  scope="col"
                  className="px-8 pt-8 pb-6 align-bottom text-[0.85rem] font-medium tracking-[-0.005em] text-muted"
                >
                  General marketing agency
                </th>
              </tr>
            </thead>
            <tbody className="max-md:block max-md:space-y-3">
              {ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className="max-md:block max-md:overflow-hidden max-md:rounded-2xl max-md:bg-[#f7f6f2]"
                >
                  <th
                    scope="row"
                    className={`px-6 py-6 align-top text-[0.95rem] font-medium tracking-[-0.01em] text-ink max-md:block max-md:px-5 max-md:pt-5 max-md:pb-2 ${
                      i ? "md:border-t md:border-ink/[0.05]" : ""
                    }`}
                  >
                    {row.label}
                  </th>
                  <td
                    className={`px-8 py-6 align-top max-md:mx-2 max-md:block max-md:rounded-xl max-md:bg-white max-md:px-4 max-md:py-3.5 ${
                      i ? "md:border-t md:border-ink/[0.05]" : ""
                    } ${i === ROWS.length - 1 ? "md:pb-8" : ""}`}
                  >
                    <span
                      className="mb-1.5 block text-[11px] font-medium tracking-[0.02em] md:hidden"
                      style={{ color: GREEN }}
                    >
                      Devable
                    </span>
                    <span className="flex gap-3 text-[0.95rem] leading-[1.6] text-ink">
                      <Check />
                      {row.devable}
                    </span>
                  </td>
                  <td
                    className={`px-8 py-6 align-top max-md:block max-md:px-5 max-md:pt-3.5 max-md:pb-5 ${
                      i ? "md:border-t md:border-ink/[0.05]" : ""
                    }`}
                  >
                    <span className="mb-1.5 block text-[11px] font-medium tracking-[0.02em] text-muted md:hidden">
                      General agency
                    </span>
                    <span className="text-[0.95rem] leading-[1.6] text-muted">
                      {row.agency}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
