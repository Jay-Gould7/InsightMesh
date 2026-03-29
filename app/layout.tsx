import type { Metadata } from "next";

import { ESpaceProvider } from "@/components/providers/espace-provider";
import { FluentProvider } from "@/components/providers/fluent-provider";
import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "InsightMesh",
  description: "AI-native feedback bounties on Conflux.",
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
