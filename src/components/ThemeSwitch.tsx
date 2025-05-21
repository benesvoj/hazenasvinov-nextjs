'use client'

import {Fragment, useEffect, useState} from 'react'
import {useTheme} from 'next-themes'
import {Menu, RadioGroup, Transition} from '@headlessui/react'
import {MoonIcon} from "@/lib/icons/MoonIcon";
import {SunIcon} from "@/lib/icons/SunIcon";
import {BlankIcon} from "@/lib/icons/BlankIcon";
import {MonitorIcon} from "@/lib/icons/MonitorIcon";

const ThemeSwitch = () => {
	const [mounted, setMounted] = useState(false)
	const {theme, setTheme, resolvedTheme} = useTheme()

	// When mounted on client, now we can show the UI
	useEffect(() => setMounted(true), [])

	// If not mounted yet, render with invisible placeholder to avoid layout shift
	if (!mounted) {
		return (
			<div className="mr-5 flex items-center">
				<div className="relative inline-block text-left">
					<div className="flex items-center justify-center opacity-0">
						<button aria-label="Theme switcher (loading)">
							<BlankIcon />
						</button>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="mr-5 flex items-center">
			<Menu as="div" className="relative inline-block text-left">
				<div className="flex items-center justify-center hover:text-primary-500 dark:hover:text-primary-400">
					<Menu.Button aria-label="Theme switcher">
						{resolvedTheme === 'dark' ? <MoonIcon/> : <SunIcon/> }
					</Menu.Button>
				</div>
				<Transition
					as={Fragment}
					enter="transition ease-out duration-100"
					enterFrom="transform opacity-0 scale-95"
					enterTo="transform opacity-100 scale-100"
					leave="transition ease-in duration-75"
					leaveFrom="transform opacity-100 scale-100"
					leaveTo="transform opacity-0 scale-95"
				>
					<Menu.Items
						className="absolute right-0 z-50 mt-2 w-32 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
						<RadioGroup value={theme} onChange={setTheme}>
							<div className="p-1">
								<RadioGroup.Option value="light">
									<Menu.Item>
										{({focus}) => (
											<button
												className={`${
													focus ? 'bg-primary-600 text-white' : ''
												} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
											>
												<div className="mr-2">
													<SunIcon/>
												</div>
												Light
											</button>
										)}
									</Menu.Item>
								</RadioGroup.Option>
								<RadioGroup.Option value="dark">
									<Menu.Item>
										{({focus}) => (
											<button
												className={`${
													focus ? 'bg-primary-600 text-white' : ''
												} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
											>
												<div className="mr-2">
													<MoonIcon/>
												</div>
												Dark
											</button>
										)}
									</Menu.Item>
								</RadioGroup.Option>
								<RadioGroup.Option value="system">
									<Menu.Item>
										{({focus}) => (
											<button
												className={`${
													focus ? 'bg-primary-600 text-white' : ''
												} group flex w-full items-center rounded-md px-2 py-2 text-sm`}
											>
												<div className="mr-2">
													<MonitorIcon/>
												</div>
												System
											</button>
										)}
									</Menu.Item>
								</RadioGroup.Option>
							</div>
						</RadioGroup>
					</Menu.Items>
				</Transition>
			</Menu>
		</div>
	)
}

export default ThemeSwitch