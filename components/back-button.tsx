"use client";

import Link from "next/link";
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
export function BackButton() {
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
      initial: { opacity: 0, x: -15, scale: 0.5, width: 0, marginRight: 0 },
      hover: { 
        opacity: 1, 
        x: 0, 
        scale: 1, 
        width: "auto",
        marginRight: 8,
        transition: jellyTransition
      },
    },
    text: {
      initial: { x: 0, color: "#a8a29e" }, // stone-400
      hover: { 
        x: 4, // Subtle shift to align with dot's original center
        color: "#000000", // Pure black
        transition: jellyTransition 
      },
    },
    dot: {
      initial: { opacity: 1, scale: 1, width: "auto", marginLeft: 10 },
      hover: { 
        opacity: 0, 
        scale: 0, 
        width: 0,
        marginLeft: 0,
        transition: { duration: 0.2 } 
      },
    },
  } as const;

  return (
    <Link href="/dashboard" className="no-underline block focus:outline-none">
      <motion.div
        initial="initial"
        whileHover="hover"
        animate="initial"
        className="relative flex h-[36px] px-[18px] items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-[16px] font-semibold uppercase tracking-[0.2px] transition-all duration-300 isolate cursor-pointer"
      >
        {/* Layer 0: Background Expansion (Origins from dot position) */}
        <motion.div
          variants={variants.bgFill}
          className="absolute right-[22px] top-1/2 z-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#a3e635]"
          style={{ transformOrigin: "center" }}
        />

        {/* Layer 1: Foreground Content */}
        <div className="relative z-10 flex items-center justify-center pointer-events-none">
          
          {/* Arrow Chevron */}
          <motion.div variants={variants.arrow} className="mr-1.5 origin-right text-black">
            <ChevronLeft className="h-5 w-5 stroke-[3px]" />
          </motion.div>

          {/* Label Text */}
          <motion.span variants={variants.text} className="flex-shrink-0">
            Back
          </motion.span>

          {/* Indicator Dot */}
          <motion.div
            variants={variants.dot}
            className="ml-2.5 h-1.5 w-1.5 rounded-full bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.4)]"
          />
        </div>
      </motion.div>
    </Link>
  );
}
