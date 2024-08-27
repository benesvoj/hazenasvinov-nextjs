import Image from "next/image";
import {texts} from "@/utils/texts";
import ThemeSwitch from "@/components/ThemeSwitch";
import Link from "@/components/Link";
import headerNavLinks from "../data/headerNavLinks";

export const Header = () => {
	return (
		<header
			className='h-auto lg:flex lg:flex-row lg:content-center lg:justify-between flex flex-col lg:py-10 '>
			<div className='w-full flex gap-4 justify-items-center'>
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
			<div className='flex flex-col justify-end'>
				<text className='text-sm leading-tight'>{texts.club.description}</text>
				<div className='flex items-center space-x-4 leading-5 sm:space-x-6 pt-4 justify-end'>
					<div
						className="no-scrollbar hidden items-center space-x-4 overflow-x-auto sm:flex sm:space-x-6">
						{headerNavLinks
							.map((link) => (
								<Link
									key={link.title}
									href={link.href}
									className="block font-medium text-gray-900 hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-400"
								>
									{link.title}
								</Link>
							))}
					</div>
					<ThemeSwitch/>
				</div>
			</div>

		</header>
	)
}