import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";
import {ThemeProviders} from "@/app/theme-providers";
import {Header} from "@/components/Header";

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
			<div className='w-full h-dvh p-4 xl:px-40'>
				<Header/>
				<nav className='w-max h-8'></nav>
				<main className='w-max h-auto'>
					{children}

				</main>
				<footer className='w-max h-8'></footer>
			</div>
		</ThemeProviders>
		</body>
		</html>
	);
}
