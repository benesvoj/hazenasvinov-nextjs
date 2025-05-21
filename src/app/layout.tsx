import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProviders} from "@/app/theme-providers";
import React from "react";
import {HeroUIProvider} from "@heroui/system";

const inter = Inter({subsets: ["latin"]});


export const metadata: Metadata = {
	title: "TJ Sokol Svinov",
	description: "Oddíl národní házené ve Svinově",
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
			<HeroUIProvider>
				{children}
			</HeroUIProvider>
		</ThemeProviders>
		</body>
		</html>
	)
		;
}
