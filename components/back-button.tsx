"use client";

import type { ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

/**
 * Robust Back Button using Framer Motion Variants.
 * This avoids React state sync issues in headless or fast-render environments.
 * 
 * Animation Logic:
 * - Parent: whileHover triggers children's "hover" variants.
 * - Background: Expands from a dot origin on the right (z-0).
 * - Content: Text slides right, Arrow pops from left (z-10).
 * - Dot: Fades/scales to zero on hover.
 */
type BackButtonProps = {
  href?: string | ComponentProps<typeof Link>["href"];
  mode?: "link" | "history";
};

export function BackButton({ href = "/dashboard", mode = "link" }: BackButtonProps) {
  const router = useRouter();

  // Common jelly transition
  const jellyTransition = {
    type: "spring" as const,
    stiffness: 600,
    damping: 15,
    mass: 0.8,
  };

  // Variants map
  const variants = {
    bgFill: {
      initial: { scale: 0, opacity: 1 },
      hover: { 
        scale: 140, 
        opacity: 1,
        transition: { duration: 0.7, ease: [0.19, 1, 0.22, 1] } 
      },
    },
    arrow: {
      initial: { opacity: 0, x: -10, scale: 0.5, width: 0, marginRight: 0 },
      hover: { 
        opacity: 1, 
        x: -10, 
        scale: 1, 
        width: 24, // Matches total shift needed
        marginRight: 8,
        transition: jellyTransition
      },
    },
    text: {
      initial: { x: 2, color: "#a8a29e" }, // Fixed color, no relative x needed as layout handles shift
      hover: { 
        x: -10, 
        color: "#000000", // Pure black
        transition: jellyTransition 
      },
    },
    dot: {
      initial: { opacity: 1, scale: 1, width: 16, marginLeft: 8 },
      hover: { 
        opacity: 0, 
        scale: 0,
        width: 0,
        marginLeft: 0,
        transition: jellyTransition 
      },
    },
  } as const;

  const content = (
    <motion.div
      initial="initial"
      whileHover="hover"
      animate="initial"
      className="relative flex h-[36px] w-[116px] flex-none items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-[16px] font-semibold uppercase tracking-[0.2px] isolate cursor-pointer"
    >
      {/* Layer 0: Background Expansion (Origins from dot position) */}
      <motion.div
        variants={variants.bgFill}
        className="absolute right-[31px] top-1/2 z-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#a3e635]"
        style={{ transformOrigin: "center" }}
      />

      {/* Layer 1: Foreground Content */}
      <div className="relative z-10 flex w-full items-center justify-center pointer-events-none px-[18px]">
        
        {/* Arrow Chevron */}
        <motion.div variants={variants.arrow} className="flex items-center justify-center origin-right text-black">
          <ChevronLeft className="h-5 w-5 stroke-[3px]" />
        </motion.div>

        {/* Label Text */}
        <motion.span variants={variants.text} className="flex-shrink-0">
          Back
        </motion.span>

        {/* Indicator Dot Container */}
        <motion.div
          variants={variants.dot}
          className="flex items-center justify-center"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.4)]" />
        </motion.div>
      </div>
    </motion.div>
  );

  if (mode === "history") {
    return (
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
            return;
          }

          if (typeof window !== "undefined") {
            window.location.assign(String(href));
          }
        }}
        className="block focus:outline-none"
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href as ComponentProps<typeof Link>["href"]} className="no-underline block focus:outline-none">
      {content}
    </Link>
  );
}
