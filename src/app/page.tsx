import Image from "next/image";
import {texts} from "@/utils/texts";

export default function Home() {
	return (
		<div className='w-full h-dvh p-20'>
			<header className='border-2 h-auto lg:flex lg:flex-row lg:content-center lg:justify-between flex flex-col '>
				<div className='w-full flex gap-4 justify-items-center pb-2 lg:pb-0'>
					<Image src='/logo.PNG' alt={texts.club.title} width={80} height={80}/>
					<div className='flex flex-col justify-items-center'>
						<h1 className='scroll-m-5 text-4xl font-extrabold tracking-tight lg:text-5xl uppercase'>
							{texts.club.title}
						</h1>
						<div>
							{texts.club.subtitle}
						</div>
					</div>
				</div>
				<div className='w-1/2'>
					<text className='text-sm leading-tight'>{texts.club.description}</text>
				</div>
			</header>
			<nav className='w-max h-8'></nav>
			<main className='w-max h-auto'>
			</main>
			<footer className='w-max h-8'></footer>
		</div>
	);
}
