'use client';

import React from 'react';

import {HeroUIProvider} from '@heroui/system';
import {ToastProvider} from '@heroui/toast';

import {ThemeProvider} from 'next-themes';

import {siteMetadata} from '@/data/siteMetadata';

export function ThemeProviders({children}: {children: React.ReactNode}) {
  return (
    <ThemeProvider attribute="class" defaultTheme={siteMetadata.theme} enableSystem>
      <HeroUIProvider>
        <ToastProvider />
        {children}
      </HeroUIProvider>
    </ThemeProvider>
  );
}
