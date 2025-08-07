'use client'

import { ThemeProvider } from 'next-themes'
import {siteMetadata} from '@/data/siteMetadata'
import React from "react";
import { HeroUIProvider } from "@heroui/system";

export function ThemeProviders({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme={siteMetadata.theme} enableSystem>
			<HeroUIProvider>
			{children}
			</HeroUIProvider>
		</ThemeProvider>
	)
}