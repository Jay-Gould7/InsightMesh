"use client";

import type { Route } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export function BackToBountyButton({ bountyId }: { bountyId: number }) {
  const bountyHref = `/bounty/${bountyId}` as Route;

  const jellyTransition = {
    type: "spring" as const,
    stiffness: 600,
    damping: 15,
    mass: 0.8,
  };

  const variants = {
    bgFill: {
      initial: { scale: 0, opacity: 1 },
      hover: {
        scale: 140,
        opacity: 1,
        transition: { duration: 0.7, ease: [0.19, 1, 0.22, 1] },
      },
    },
    arrow: {
      initial: { opacity: 0, x: -10, scale: 0.5, width: 0, marginRight: 0 },
      hover: {
        opacity: 1,
        x: -10,
        scale: 1,
        width: 24,
        marginRight: 8,
        transition: jellyTransition,
      },
    },
    text: {
      initial: { x: 2, color: "#a8a29e" },
      hover: {
        x: -10,
        color: "#000000",
        transition: jellyTransition,
      },
    },
    dot: {
      initial: { opacity: 1, scale: 1, width: 16, marginLeft: 8 },
      hover: {
        opacity: 0,
        scale: 0,
        width: 0,
        marginLeft: 0,
        transition: jellyTransition,
      },
    },
  } as const;

  return (
    <Link href={bountyHref} prefetch className="block focus:outline-none">
      <motion.div
        initial="initial"
        whileHover="hover"
        animate="initial"
        className="relative flex h-[36px] w-[116px] flex-none items-center justify-center overflow-hidden rounded-full border border-white/10 bg-white/5 text-[16px] font-semibold uppercase tracking-[0.2px] isolate cursor-pointer"
      >
        <motion.div
          variants={variants.bgFill}
          className="absolute right-[31px] top-1/2 z-0 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#a3e635]"
          style={{ transformOrigin: "center" }}
        />

        <div className="relative z-10 flex w-full items-center justify-center pointer-events-none px-[18px]">
          <motion.div variants={variants.arrow} className="flex items-center justify-center origin-right text-black">
            <ChevronLeft className="h-5 w-5 stroke-[3px]" />
          </motion.div>

          <motion.span variants={variants.text} className="flex-shrink-0">
            Back
          </motion.span>

          <motion.div variants={variants.dot} className="flex items-center justify-center">
            <div className="h-1.5 w-1.5 rounded-full bg-[#a3e635] shadow-[0_0_8px_rgba(163,230,53,0.4)]" />
          </motion.div>
        </div>
      </motion.div>
    </Link>
  );
}
