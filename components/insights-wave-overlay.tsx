"use client";

import { motion } from "framer-motion";
import { useEffect, useId, useMemo, useState } from "react";

import { INSIGHTS_ANALYSIS_EVENT } from "@/lib/insights-wave";

const VIEWBOX_WIDTH = 1440;
const VIEWBOX_HEIGHT = 320;
const WAVE_SEGMENT = 180;
const WAVE_LENGTH = 520;

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

const waveLayers: WaveLayer[] = [
  {
    key: "primary",
    baseline: 122,
    phaseOffset: 0,
    duration: 4.8,
    strokeWidth: 3.4,
    restAmplitude: 12,
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
    duration: 3.9,
    strokeWidth: 2.5,
    restAmplitude: 8,
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
    duration: 3.1,
    strokeWidth: 1.7,
    restAmplitude: 5,
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

function buildWavePath(baseline: number, amplitude: number, phase: number) {
  const sampleY = (x: number) =>
    baseline + Math.sin((x / WAVE_LENGTH) * Math.PI * 2 + phase) * amplitude;

  let path = `M 0 ${sampleY(0)}`;

  for (let x = 0; x < VIEWBOX_WIDTH; x += WAVE_SEGMENT) {
    const cp1X = x + WAVE_SEGMENT / 3;
    const cp2X = x + (WAVE_SEGMENT * 2) / 3;
    const endX = x + WAVE_SEGMENT;
    path += ` C ${cp1X} ${sampleY(cp1X)} ${cp2X} ${sampleY(cp2X)} ${endX} ${sampleY(endX)}`;
  }

  return path;
}

function buildWaveFrames(baseline: number, amplitude: number, phaseOffset: number) {
  const frameCount = 10;
  return Array.from({ length: frameCount + 1 }, (_, index) => {
    const phase = phaseOffset + (index / frameCount) * Math.PI * 2;
    return buildWavePath(baseline, amplitude, phase);
  });
}

export function InsightsWaveOverlay() {
  const uniqueId = useId().replace(/:/g, "-");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        waveFrames: buildWaveFrames(
          layer.baseline,
          isAnalyzing ? layer.activeAmplitude : layer.restAmplitude,
          layer.phaseOffset,
        ),
      })),
    [isAnalyzing, uniqueId],
  );

  const keyframeTimes = animatedLayers[0]?.waveFrames.map((_, index, array) => index / (array.length - 1)) ?? [0, 1];
  const keyTimesString = keyframeTimes.join(";");
  const keySplinesString = keyframeTimes.length > 1
    ? Array.from({ length: keyframeTimes.length - 1 }, () => "0.42 0 0.58 1").join(";")
    : undefined;

  return (
    <motion.div
      initial={false}
      animate={{
        top: isAnalyzing ? -148 : -28,
        height: isAnalyzing ? 320 : 118,
        opacity: isAnalyzing ? 1 : 0.92,
      }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none absolute inset-x-[-6%] z-50 overflow-visible"
      style={{
        filter: isAnalyzing
          ? "drop-shadow(0 0 36px rgba(94,234,212,0.24))"
          : "drop-shadow(0 0 12px rgba(94,234,212,0.08))",
      }}
      aria-hidden
    >
      {animatedLayers.map((layer) => (
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
            d={layer.waveFrames[0]}
            fill="none"
            stroke={`url(#${layer.gradientId})`}
            strokeWidth={layer.strokeWidth}
            strokeLinecap="round"
            opacity={isAnalyzing ? layer.activeOpacity : layer.restOpacity}
            style={{ mixBlendMode: "screen" }}
          >
            <animate
              attributeName="d"
              dur={`${layer.duration}s`}
              repeatCount="indefinite"
              calcMode="spline"
              keyTimes={keyTimesString}
              keySplines={keySplinesString}
              values={layer.waveFrames.join(";")}
            />
          </path>
        </svg>
      ))}
    </motion.div>
  );
}
