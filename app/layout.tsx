import type { Metadata, Viewport } from "next";

import { ESpaceProvider } from "@/components/providers/espace-provider";
import { FluentProvider } from "@/components/providers/fluent-provider";
import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "InsightMesh",
  description: "AI-native feedback bounties on Conflux.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#07130d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FluentProvider>
          <ESpaceProvider>
            <SiteShell>{children}</SiteShell>
          </ESpaceProvider>
        </FluentProvider>
      </body>
    </html>
  );
}
