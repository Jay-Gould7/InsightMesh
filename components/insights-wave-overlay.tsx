"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { INSIGHTS_ANALYSIS_EVENT } from "@/lib/insights-wave";

const VIEWBOX_WIDTH = 1440;
const VIEWBOX_HEIGHT = 320;
const WAVE_SAMPLE_STEP = 24;
const WAVE_LENGTH = 760;
const TWO_PI = Math.PI * 2;

type WaveLayer = {
  key: string;
  baseline: number;
  phaseOffset: number;
  duration: number;
  strokeWidth: number;
  restAmplitude: number;
  activeAmplitude: number;
  restOpacity: number;
  activeOpacity: number;
  gradientStops: Array<{ offset: string; color: string }>;
};

type WavePoint = {
  x: number;
  y: number;
};

const waveLayers: WaveLayer[] = [
  {
    key: "primary",
    baseline: 122,
    phaseOffset: 0,
    duration: 6.2,
    strokeWidth: 3.4,
    restAmplitude: 14,
    activeAmplitude: 112,
    restOpacity: 0.74,
    activeOpacity: 1,
    gradientStops: [
      { offset: "0%", color: "rgba(163,230,53,0)" },
      { offset: "16%", color: "rgba(163,230,53,0.98)" },
      { offset: "50%", color: "rgba(94,234,212,1)" },
      { offset: "84%", color: "rgba(34,211,238,0.94)" },
      { offset: "100%", color: "rgba(34,211,238,0)" },
    ],
  },
  {
    key: "secondary",
    baseline: 142,
    phaseOffset: Math.PI / 2.8,
    duration: 5.1,
    strokeWidth: 2.5,
    restAmplitude: 9,
    activeAmplitude: 84,
    restOpacity: 0.34,
    activeOpacity: 0.82,
    gradientStops: [
      { offset: "0%", color: "rgba(94,234,212,0)" },
      { offset: "18%", color: "rgba(94,234,212,0.76)" },
      { offset: "50%", color: "rgba(255,255,255,0.92)" },
      { offset: "82%", color: "rgba(163,230,53,0.72)" },
      { offset: "100%", color: "rgba(163,230,53,0)" },
    ],
  },
  {
    key: "glow",
    baseline: 158,
    phaseOffset: Math.PI / 1.6,
    duration: 4.2,
    strokeWidth: 1.7,
    restAmplitude: 6,
    activeAmplitude: 62,
    restOpacity: 0.16,
    activeOpacity: 0.54,
    gradientStops: [
      { offset: "0%", color: "rgba(255,255,255,0)" },
      { offset: "20%", color: "rgba(255,255,255,0.42)" },
      { offset: "50%", color: "rgba(94,234,212,0.6)" },
      { offset: "80%", color: "rgba(255,255,255,0.4)" },
      { offset: "100%", color: "rgba(255,255,255,0)" },
    ],
  },
];

function buildWavePath(
  baseline: number,
  amplitude: number,
  phase: number,
  timePhase: number,
  detailPhase: number,
) {
  const sampleY = (x: number) => {
    const primaryShape = Math.sin((x / WAVE_LENGTH) * TWO_PI + phase);
    const secondaryShape = Math.sin((x / (WAVE_LENGTH * 0.58)) * TWO_PI + phase * 0.64);
    const tertiaryShape = Math.sin((x / (WAVE_LENGTH * 1.52)) * TWO_PI - phase * 0.34);

    const primaryMotion = Math.sin(timePhase);
    const secondaryMotion = Math.sin(timePhase * 1.38 + phase * 0.72);
    const tertiaryMotion = Math.sin(detailPhase * 0.84 - phase * 0.56);

    const standingWave =
      primaryShape * primaryMotion +
      secondaryShape * 0.32 * secondaryMotion +
      tertiaryShape * 0.18 * tertiaryMotion;

    return baseline + standingWave * amplitude;
  };

  const points: WavePoint[] = [];
  for (let x = -WAVE_SAMPLE_STEP; x <= VIEWBOX_WIDTH + WAVE_SAMPLE_STEP; x += WAVE_SAMPLE_STEP) {
    points.push({ x, y: sampleY(x) });
  }

  let path = `M ${points[1]?.x ?? 0} ${points[1]?.y ?? sampleY(0)}`;

  for (let index = 1; index < points.length - 2; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2];

    const cp1X = current.x + (next.x - previous.x) / 6;
    const cp1Y = current.y + (next.y - previous.y) / 6;
    const cp2X = next.x - (afterNext.x - current.x) / 6;
    const cp2Y = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${cp1X} ${cp1Y} ${cp2X} ${cp2Y} ${next.x} ${next.y}`;
  }

  return path;
}

export function InsightsWaveOverlay() {
  const uniqueId = useId().replace(/:/g, "-");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pathRefs = useRef<Array<SVGPathElement | null>>([]);
  const opacityRefs = useRef<number[]>(waveLayers.map((layer) => layer.restOpacity));
  const amplitudeRefs = useRef<number[]>(waveLayers.map((layer) => layer.restAmplitude));
  const analyzingTargetRef = useRef(false);

  useEffect(() => {
    analyzingTargetRef.current = isAnalyzing;
  }, [isAnalyzing]);

  useEffect(() => {
    const handleAnalysisState = (event: Event) => {
      const customEvent = event as CustomEvent<{ active?: boolean }>;
      setIsAnalyzing(Boolean(customEvent.detail?.active));
    };

    window.addEventListener(INSIGHTS_ANALYSIS_EVENT, handleAnalysisState as EventListener);

    return () => {
      window.removeEventListener(INSIGHTS_ANALYSIS_EVENT, handleAnalysisState as EventListener);
    };
  }, []);

  const animatedLayers = useMemo(
    () =>
      waveLayers.map((layer) => ({
        ...layer,
        gradientId: `${layer.key}-insights-wave-${uniqueId}`,
      })),
    [uniqueId],
  );

  useEffect(() => {
    let frameId = 0;
    let previousTime = 0;

    const tick = (time: number) => {
      if (!previousTime) {
        previousTime = time;
      }

      const delta = Math.min(40, time - previousTime);
      previousTime = time;
      animatedLayers.forEach((layer, index) => {
        const targetAmplitude = analyzingTargetRef.current ? layer.activeAmplitude : layer.restAmplitude;
        const targetOpacity = analyzingTargetRef.current ? layer.activeOpacity : layer.restOpacity;
        const smoothing = analyzingTargetRef.current
          ? 1 - Math.exp(-delta / 70)
          : 1 - Math.exp(-delta / 180);

        amplitudeRefs.current[index] += (targetAmplitude - amplitudeRefs.current[index]) * smoothing;
        opacityRefs.current[index] += (targetOpacity - opacityRefs.current[index]) * smoothing;

        const pulse = Math.sin((time / 1000 / layer.duration) * TWO_PI + layer.phaseOffset);
        const breathing = 0.72 + ((pulse + 1) / 2) * 0.56;
        const motionPhase = (time / 1000 / layer.duration) * TWO_PI + layer.phaseOffset;
        const detailPhase = (time / 1000 / (layer.duration * 0.76)) * TWO_PI;
        const verticalOffset = Math.sin((time / 1000 / (layer.duration * 1.28)) * TWO_PI + layer.phaseOffset) *
          (analyzingTargetRef.current ? 26 : 8);
        const liveAmplitude = amplitudeRefs.current[index] * breathing;
        const path = pathRefs.current[index];
        if (path) {
          path.setAttribute(
            "d",
            buildWavePath(layer.baseline + verticalOffset, liveAmplitude, layer.phaseOffset, motionPhase, detailPhase),
          );
          path.setAttribute("opacity", `${opacityRefs.current[index]}`);
        }
      });

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [animatedLayers]);

  return (
    <motion.div
      initial={false}
      animate={{
        opacity: isAnalyzing ? 1 : 0.92,
      }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-x-[-6%] top-[-112px] z-50 h-[320px] overflow-visible"
      style={{
        filter: isAnalyzing
          ? "drop-shadow(0 0 36px rgba(94,234,212,0.24))"
          : "drop-shadow(0 0 12px rgba(94,234,212,0.08))",
      }}
      aria-hidden
    >
      {animatedLayers.map((layer, index) => (
        <svg
          key={layer.key}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id={layer.gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              {layer.gradientStops.map((stop) => (
                <stop key={`${layer.key}-${stop.offset}`} offset={stop.offset} stopColor={stop.color} />
              ))}
            </linearGradient>
          </defs>

          <path
            ref={(node) => {
              pathRefs.current[index] = node;
            }}
            d={buildWavePath(layer.baseline, layer.restAmplitude, layer.phaseOffset, 0, 0)}
            fill="none"
            stroke={`url(#${layer.gradientId})`}
            strokeWidth={layer.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={layer.restOpacity}
            style={{ mixBlendMode: "screen" }}
          />
        </svg>
      ))}
    </motion.div>
  );
}
