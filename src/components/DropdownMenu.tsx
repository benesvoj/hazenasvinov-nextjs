'use client'
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import {ChevronDownIcon} from '@heroicons/react/16/solid'
import {MenuItem} from "../data/headerNavLinks";

interface Props {
	item: MenuItem
}

const categories_old = [
	{ title: 'Přípravka', description: 'Get a better understanding of your traffic', route: '#'},
	{ title: 'Mladší žáci', description: 'Get a better understanding of your traffic', route: '#'},
	{ title: 'Mladší žačky', description: 'Speak directly to your customers', route: '#'},
	{ title: 'Starší žáci', description: "Your customers' data will be safe and secure", route: '#'},
	{ title: 'Starší žačky', description: 'Connect with third-party tools', route: '#'},
	{ title: 'Dorostenci', description: 'Build strategic funnels that will convert', route: '#'},
	{ title: 'Dorostenky', description: 'Build strategic funnels that will convert', route: '#'},
	{ title: 'Muži', description: 'Build strategic funnels that will convert', route: '#'},
	{ title: 'Ženy', description: 'Build strategic funnels that will convert', route: '#'  },
]

export default function DropdownMenu(props: Props) {
	const {item} = props;
	const categories = item?.children ? item.children : []

	return (
		<Popover className="relative">
			<PopoverButton className="inline-flex items-center gap-x-1 text-sm/6 font-semibold text-gray-900">
				<span>Kategorie</span>
				<ChevronDownIcon aria-hidden="true" className="size-5" />
			</PopoverButton>

			<PopoverPanel
				transition
				className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-max -translate-x-1/2 px-4 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
			>
				<div className="w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm/6 shadow-lg ring-1 ring-gray-900/5">
					<div className="p-4">
						{categories_old.map((item) => (
							<div key={item.title} className="group relative flex gap-x-6 rounded-lg p-4 hover:bg-gray-50">
								<div>
									<a href={item.route} className="font-semibold text-gray-900">
										{item.title}
										<span className="absolute inset-0" />
									</a>
									<p className="mt-1 text-gray-600">{item.description}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</PopoverPanel>
		</Popover>
	)
}
