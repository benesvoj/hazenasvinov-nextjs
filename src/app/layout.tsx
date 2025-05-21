import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProviders} from "@/app/theme-providers";
import React from "react";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
	title: "TJ Sokol Svinov",
	description: "Oddíl národní házené ve Svinově",
};

export default function RootLayout({
									   children,
								   }: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
		<body className={inter.className}>
		<ThemeProviders>
			{children}
		</ThemeProviders>
		</body>
		</html>
	)
		;
}
