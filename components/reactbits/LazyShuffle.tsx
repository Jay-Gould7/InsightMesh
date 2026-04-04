"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties, type JSX } from "react";

import type { ShuffleProps } from "./shuffle";

const AnimatedShuffle = dynamic(() => import("./shuffle"), {
  ssr: false,
});

export default function LazyShuffle({
  text,
  className = "",
  style,
  tag = "p",
  textAlign = "center",
  ...rest
}: ShuffleProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    const Tag = tag as keyof JSX.IntrinsicElements;
    const fallbackStyle = {
      textAlign,
      ...style,
    } as CSSProperties;

    return React.createElement(Tag, { className, style: fallbackStyle }, text);
  }

  return (
    <AnimatedShuffle
      text={text}
      className={className}
      style={style}
      tag={tag}
      textAlign={textAlign}
      {...rest}
    />
  );
}
