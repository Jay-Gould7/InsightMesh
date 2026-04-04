"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";

import type { PillNavItem, PillNavProps } from "./PillNav";

const AnimatedPillNav = dynamic(() => import("./PillNav"), {
  ssr: false,
});

function isExternalLink(href: string) {
  return (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("//") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("#")
  );
}

function isRouterLink(href?: PillNavItem["href"]) {
  return href && typeof href === "string" && !isExternalLink(href);
}

function StaticPillNav({
  logo,
  logoAlt = "Logo",
  items,
  activeHref,
  className = "",
  baseColor = "#fff",
  pillColor = "#060010",
  hoveredPillTextColor = "#060010",
  pillTextColor,
  hoverColor,
  bgColor,
}: PillNavProps) {
  const resolvedHoverColor = hoverColor ?? baseColor;
  const resolvedBgColor = bgColor ?? "transparent";
  const resolvedPillTextColor = pillTextColor ?? baseColor;

  const cssVars = {
    ["--pill-bg"]: pillColor,
    ["--hover-text"]: hoveredPillTextColor,
    ["--pill-text"]: resolvedPillTextColor,
    ["--nav-bg"]: resolvedBgColor,
    ["--hover-pill"]: resolvedHoverColor,
    ["--nav-h"]: "42px",
    ["--pill-pad-x"]: "18px",
    ["--pill-gap"]: "3px",
  } as CSSProperties;

  const basePillClasses =
    "relative inline-flex h-full items-center justify-center rounded-full px-0 font-semibold uppercase leading-[0] tracking-[0.2px] whitespace-nowrap no-underline";

  return (
    <div className={`relative z-10 w-full md:w-auto ${className}`} style={cssVars}>
      <nav
        className="box-border flex w-full items-center justify-between md:w-max md:justify-start md:px-0"
        aria-label="Primary"
      >
        {logo &&
          (isRouterLink(items?.[0]?.href) ? (
            <Link
              href={items[0].href as any}
              aria-label="Home"
              role="menuitem"
              className="inline-flex items-center justify-center overflow-hidden rounded-full p-2"
              style={{
                width: "var(--nav-h)",
                height: "var(--nav-h)",
                background: "var(--base, #000)",
              }}
            >
              <img src={logo} alt={logoAlt} className="block h-full w-full object-cover" />
            </Link>
          ) : (
            <a
              href={items?.[0]?.href || "#"}
              aria-label="Home"
              className="inline-flex items-center justify-center overflow-hidden rounded-full p-2"
              style={{
                width: "var(--nav-h)",
                height: "var(--nav-h)",
                background: "var(--base, #000)",
              }}
            >
              <img src={logo} alt={logoAlt} className="block h-full w-full object-cover" />
            </a>
          ))}

        <div
          className={`relative hidden items-center rounded-full md:flex ${logo ? "ml-2" : ""}`}
          style={{
            height: "var(--nav-h)",
            background: "var(--nav-bg, #000)",
          }}
        >
          <ul
            role="menubar"
            className="m-0 flex h-full list-none items-stretch p-[3px]"
            style={{ gap: "var(--pill-gap)" }}
          >
            {items.map((item) => {
              const isActive = activeHref === (item.href as any);
              const pillStyle: CSSProperties = {
                background: isActive ? "var(--hover-pill)" : "var(--pill-bg, #fff)",
                color: isActive ? "var(--hover-text)" : "var(--pill-text, #fff)",
                paddingLeft: "var(--pill-pad-x)",
                paddingRight: "var(--pill-pad-x)",
              };

              const content = (
                <>
                  <span className="relative z-[2] inline-block leading-[1]">{item.label}</span>
                  {isActive && (
                    <span
                      className="absolute left-1/2 -bottom-[6px] z-[4] h-1 w-1 -translate-x-1/2 rounded-full"
                      style={{ background: "var(--hover-pill, #a3e635)" }}
                      aria-hidden="true"
                    />
                  )}
                </>
              );

              return (
                <li key={item.href} role="none" className="flex h-full">
                  {isRouterLink(item.href) ? (
                    <Link
                      role="menuitem"
                      href={item.href as any}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                    >
                      {content}
                    </Link>
                  ) : (
                    <a
                      role="menuitem"
                      href={item.href}
                      className={basePillClasses}
                      style={pillStyle}
                      aria-label={item.ariaLabel || item.label}
                    >
                      {content}
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}

export default function LazyPillNav(props: PillNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <StaticPillNav {...props} />;
  }

  return <AnimatedPillNav {...props} />;
}
