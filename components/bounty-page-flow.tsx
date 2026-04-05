"use client";

import { useLayoutEffect, useRef, useState } from "react";

import LaserFlow from "@/components/reactbits/LaserFlow";

const FLOW_START_OFFSET = -30;
const MIN_FLOW_HEIGHT = 360;
const FLOW_BOTTOM_OVERSHOOT = 10;
const FLOW_HORIZONTAL_ANCHOR = "60%";

const flowMask =
  "linear-gradient(180deg, rgba(0,0,0,0.99) 0%, rgba(0,0,0,0.98) 16%, rgba(0,0,0,0.92) 48%, rgba(0,0,0,0.58) 78%, transparent 100%)";

export function BountyPageFlow({ visible = true }: { visible?: boolean }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [flowHeight, setFlowHeight] = useState(MIN_FLOW_HEIGHT);
  const [isMeasured, setIsMeasured] = useState(false);

  useLayoutEffect(() => {
    if (!visible) return;

    const root = rootRef.current;
    const pageRoot = root?.parentElement;
    if (!root || !pageRoot) return;

    const updateHeight = () => {
      const target =
        (pageRoot.querySelector("[data-survey-flow-target]") as HTMLElement | null) ??
        (pageRoot.querySelector("[data-survey-form-root]") as HTMLElement | null);
      if (!target) return;

      const pageRect = pageRoot.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextHeight = Math.max(
        MIN_FLOW_HEIGHT,
        targetRect.top - pageRect.top + FLOW_BOTTOM_OVERSHOOT - FLOW_START_OFFSET,
      );

      setFlowHeight(nextHeight);
      setIsMeasured(true);
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(pageRoot);

    const target =
      (pageRoot.querySelector("[data-survey-flow-target]") as HTMLElement | null) ??
      (pageRoot.querySelector("[data-survey-form-root]") as HTMLElement | null);
    if (target) {
      resizeObserver.observe(target);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [visible]);

  const shiftedCenterStyle = {
    left: FLOW_HORIZONTAL_ANCHOR,
  } as const;

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-x-0 z-0 flex justify-center overflow-visible"
      style={{
        top: `${FLOW_START_OFFSET}px`,
        height: `${flowHeight}px`,
        opacity: visible && isMeasured ? 1 : 0,
      }}
    >
      <div className="relative h-full w-full max-w-6xl overflow-visible">
        <div
          className="absolute top-0 h-full w-[56rem] -translate-x-1/2 opacity-[0.94]"
          style={{ ...shiftedCenterStyle, WebkitMaskImage: flowMask, maskImage: flowMask }}
        >
          <LaserFlow
            className="absolute inset-0"
            horizontalBeamOffset={0.1}
            verticalBeamOffset={-0.12}
            color="#35c04c"
            horizontalSizing={0.5}
            verticalSizing={2}
            wispDensity={1}
            wispSpeed={15}
            wispIntensity={5}
            flowSpeed={0.35}
            flowStrength={0.25}
            fogIntensity={0.45}
            fogScale={0.3}
            fogFallSpeed={0.6}
            decay={1.1}
            falloffStart={1.2}
            mouseTiltStrength={0.01}
          />
        </div>

        <div
          className="absolute top-1 h-10 w-48 -translate-x-1/2 rounded-full bg-[#35c04c]/10 blur-2xl"
          style={shiftedCenterStyle}
        />
        <div
          className="absolute top-0 h-24 w-[22rem] -translate-x-1/2 bg-[radial-gradient(circle_at_top,rgba(53,192,76,0.18),rgba(53,192,76,0.05)_42%,transparent_74%)] blur-3xl"
          style={shiftedCenterStyle}
        />
        <div
          className="absolute bottom-[-0.1rem] h-20 w-[26rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(53,192,76,0.24),rgba(53,192,76,0.08)_36%,transparent_74%)] blur-2xl"
          style={shiftedCenterStyle}
        />
        <div
          className="absolute bottom-[-0.05rem] h-18 w-[72rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(53,192,76,0.26),rgba(53,192,76,0.1)_20%,rgba(53,192,76,0.04)_40%,transparent_76%)] blur-[22px]"
          style={shiftedCenterStyle}
        />
        <div
          className="absolute bottom-[0.8rem] h-24 w-[52rem] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(53,192,76,0.14),rgba(53,192,76,0.05)_34%,transparent_76%)] blur-3xl"
          style={shiftedCenterStyle}
        />
      </div>
    </div>
  );
}
