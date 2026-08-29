import './globals.css';

import React from 'react';

import {Inter} from 'next/font/google';

import type {Metadata} from 'next';

import {ConditionalProviders} from '@/components/providers/ConditionalProviders';

const inter = Inter({subsets: ['latin']});

// Helper function to get the base URL based on environment
function getBaseUrl() {
  // In production, use the production URL
  if (process.env.NODE_ENV === 'production') {
    return 'https://hazenasvinov.cz';
  }

  // In development, use localhost (hardcoded to avoid webpack serialization)
  return 'http://localhost:3000';
}

export const metadata: Metadata = {
  title: 'TJ Sokol Svinov - Národní házená',
  description: 'Oficiální web oddílu národní házené TJ Sokol Svinov',
  metadataBase: new URL(getBaseUrl()),
  openGraph: {
    title: 'TJ Sokol Svinov',
    description: 'Oddíl národní házené s více než 90letou tradicí',
    images: ['/og-image.jpg'],
    url: getBaseUrl(),
    siteName: 'TJ Sokol Svinov',
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TJ Sokol Svinov - Národní házená',
    description: 'Oddíl národní házené s více než 90letou tradicí',
    images: ['/og-image.jpg'],
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
    // lang is cs, not en: every user-facing string in this app is Czech. Declared
    // as English, Chrome sees Czech text on a page claiming to be English and
    // translates it — and the translation engine rewrites text nodes underneath
    // React, which then finds the DOM somewhere other than where it left it and
    // throws "Failed to execute 'insertBefore' on 'Node'". Reported from the
    // coach portal on 2026-08-29 by a coach whose Chrome runs in Czech.
    <html lang="cs" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={inter.className}>
        <ConditionalProviders>{children}</ConditionalProviders>
      </body>
    </html>
  );
}
