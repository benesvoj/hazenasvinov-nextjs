"use client";

import { ThemeProvider } from "next-themes";
import { siteMetadata } from "@/data/siteMetadata";
import React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={siteMetadata.theme}
      enableSystem
    >
      <HeroUIProvider>
        <ToastProvider />
		{children}
      </HeroUIProvider>
    </ThemeProvider>
  );
}
