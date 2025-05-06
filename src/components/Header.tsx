import Image from "next/image";
import {texts} from "@/utils/texts";
import ThemeSwitch from "@/components/ThemeSwitch";
import Link from "@/components/Link";
import menuItems from "../data/headerNavLinks";
import DropdownMenu from "@/components/DropdownMenu";

export const Header = () => {

	return (
		<header
			className='h-auto lg:flex lg:flex-col lg:content-center lg:justify-between flex flex-col lg:py-10 '>
			<div className='w-full flex gap-4 justify-items-center justify-between'>
				<div className='flex justify-items-center max-w-fit lg:gap-8 sm:gap-4'>
					<div className='flex items-center'>
						<Image src='/logo.png' alt={texts.club.title} width={80} height={84}/>
					</div>
					<div className='flex flex-col justify-center'>
						<h1 className='scroll-m-5 text-4xl font-extrabold tracking-tight lg:text-5xl uppercase'>
							{texts.club.title}
						</h1>
						<div>
							{texts.club.subtitle}
						</div>
					</div>
				</div>
				<div className='flex flex-col justify-end w-1/3'>
					<text className='text-sm leading-tightl'>{texts.club.description}</text>
				</div>
			</div>
			<div className='flex items-center space-x-4 leading-5 sm:space-x-6 pt-4 justify-center'>
				<div
					className="no-scrollbar hidden items-center space-x-4  sm:flex sm:space-x-6">
					{menuItems
						.map((item) => {
								return item.hasOwnProperty('children') ? (
									<DropdownMenu key={item.title} item={item}/>
								) : (
									(
										<Link
											key={item.route}
											href={item.route || ''}
											className="block font-medium text-gray-900 hover:text-primary-500 dark:text-gray-100 dark:hover:text-primary-400"
										>
											{item.title}
										</Link>
									)
								)
							}
						)}
				</div>
				<ThemeSwitch/>
			</div>

		</header>
	)
}