import "./globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProviders } from "@/app/theme-providers";
import { ChunkErrorBoundary, DatabaseErrorBoundary } from "@/components";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

// Helper function to get the base URL based on environment
function getBaseUrl() {
  // In production, use the production URL
  if (process.env.NODE_ENV === "production") {
    return "https://hazenasvinov.cz";
  }

  // In development, use localhost (hardcoded to avoid webpack serialization)
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "TJ Sokol Svinov - Národní házená",
  description: "Oficiální web oddílu národní házené TJ Sokol Svinov",
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: "TJ Sokol Svinov",
    description: "Oddíl národní házené s více než 90letou tradicí",
    images: ["/og-image.jpg"],
    url: getBaseUrl(),
    siteName: "TJ Sokol Svinov",
    locale: "cs_CZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TJ Sokol Svinov - Národní házená",
    description: "Oddíl národní házené s více než 90letou tradicí",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProviders>
          <ChunkErrorBoundary>
            <DatabaseErrorBoundary>{children}</DatabaseErrorBoundary>
          </ChunkErrorBoundary>
        </ThemeProviders>
      </body>
    </html>
  );
}
