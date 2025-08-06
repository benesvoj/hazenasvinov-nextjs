import "./globals.css";

import type {Metadata} from "next";
import {Inter} from "next/font/google";
import {ThemeProviders} from "@/app/theme-providers";
import React from "react";

const inter = Inter({subsets: ["latin"]});



export const metadata: Metadata = {
	title: 'TJ Sokol Svinov - Národní házená',
	description: 'Oficiální web oddílu národní házené TJ Sokol Svinov',
	openGraph: {
	  title: 'TJ Sokol Svinov',
	  description: 'Oddíl národní házené s více než 90letou tradicí',
	  images: ['/og-image.jpg'],
	},
  }

export default function RootLayout({
									   children,
								   }: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
		<body className={inter.className}>
		<ThemeProviders>
			{children}
		</ThemeProviders>
		</body>
		</html>
	)
		;
}
