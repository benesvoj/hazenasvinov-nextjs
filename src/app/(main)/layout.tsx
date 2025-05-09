import {Header} from "@/components/Header";
import React from "react";

export default function MainLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='w-full h-dvh p-4 xl:px-40'>
			<Header/>
			<main className='w-max h-auto'>
				{children}
			</main>
			<footer className='w-max h-8'></footer>
		</div>
	);
}
