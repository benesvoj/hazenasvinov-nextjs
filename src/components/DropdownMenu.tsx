'use client'

import {Popover, PopoverButton, PopoverPanel} from '@headlessui/react'
import {ChevronDownIcon} from '@heroicons/react/16/solid'
import {MenuItem} from "@/data/headerNavLinks";

interface Props {
	item: MenuItem
}

export default function DropdownMenu(props: Props) {
	const {item} = props;
	const menuItems = item?.children || []

	if (!menuItems.length) {
		return null
	}

	return (
		<Popover className="relative inline-block text-left">
			<PopoverButton className="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900">
				<span>{item.title}</span>
				<ChevronDownIcon aria-hidden="true" className="size-5"/>
			</PopoverButton>

			<PopoverPanel
				transition
				className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 px-4 transition-transform duration-200 ease-out"
			>
				<div
					className="w-screen max-w-lg flex-auto overflow-hidden rounded-3xl bg-white text-sm/6 shadow-lg ring-1 ring-gray-900/5">
					<div className="p-4">
						<div className='grid grid-cols-2 gap-4'>
							{menuItems.map((menuItem) => (
								<div key={menuItem.title}
									 className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
									<div>
										<a href={menuItem.route} className="font-semibold text-gray-900">
											{menuItem.title}
											<span className="absolute inset-0"/>
										</a>
										{menuItem.description && (
											<p className="mt-1 text-gray-600">{menuItem.description}</p>
										)}
									</div>
								</div>
							))
							}
						</div>
					</div>
				</div>
			</PopoverPanel>
		</Popover>
	)
}
