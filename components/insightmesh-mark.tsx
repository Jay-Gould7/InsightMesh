import { useId } from "react";

type InsightMeshMarkProps = {
  className?: string;
  title?: string;
};

export function InsightMeshMark({
  className,
  title = "InsightMesh",
}: InsightMeshMarkProps) {
  const gradientId = useId();
  const bgId = useId();
  const panelId = useId();
  const glowId = useId();

  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <radialGradient id={bgId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20 14) rotate(48.8) scale(54.9755)">
          <stop stopColor="#103521" />
          <stop offset="0.55" stopColor="#0A1710" />
          <stop offset="1" stopColor="#050806" />
        </radialGradient>
        <linearGradient id={panelId} x1="17" y1="14" x2="47" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0F2217" />
          <stop offset="1" stopColor="#09120C" />
        </linearGradient>
        <linearGradient id={gradientId} x1="19" y1="18" x2="46" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8FF72" />
          <stop offset="0.5" stopColor="#7EF0B3" />
          <stop offset="1" stopColor="#42D293" />
        </linearGradient>
        <filter id={glowId} x="2" y="2" width="60" height="60" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="4" result="effect1_foregroundBlur_0_1" />
        </filter>
      </defs>

      <g filter={`url(#${glowId})`} opacity="0.32">
        <rect x="8" y="8" width="48" height="48" rx="16" fill="#42D293" />
      </g>

      <rect x="4" y="4" width="56" height="56" rx="18" fill={`url(#${bgId})`} />
      <rect x="4.75" y="4.75" width="54.5" height="54.5" rx="17.25" stroke="rgba(255,255,255,0.08)" />

      <path
        d="M17 23.5C17 18.8056 20.8056 15 25.5 15H39.5C44.1944 15 48 18.8056 48 23.5V31.5C48 36.1944 44.1944 40 39.5 40H31.7L25.3174 45.3956C24.3406 46.2216 22.8333 45.5275 22.8333 44.2481V40H25.5C20.8056 40 17 36.1944 17 31.5V23.5Z"
        fill={`url(#${panelId})`}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1.5"
      />

      <path
        d="M22 34L31.5 23L41 34"
        stroke={`url(#${gradientId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M31.5 23V34"
        stroke={`url(#${gradientId})`}
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      <circle cx="22" cy="34" r="3.4" fill="#08110B" stroke={`url(#${gradientId})`} strokeWidth="2" />
      <circle cx="31.5" cy="23" r="3.4" fill="#08110B" stroke={`url(#${gradientId})`} strokeWidth="2" />
      <circle cx="41" cy="34" r="3.4" fill="#08110B" stroke={`url(#${gradientId})`} strokeWidth="2" />

      <path
        d="M43.8 17.8L45.1 20.5L47.8 21.8L45.1 23.1L43.8 25.8L42.5 23.1L39.8 21.8L42.5 20.5L43.8 17.8Z"
        fill="#D8FF72"
      />
    </svg>
  );
}
