import {ReactNode} from "react";

import {twMerge} from "tailwind-merge";

export interface GridItemProps {
	span?: 1 | 2 | 3 | 4 | 5 | 6;
	className?: string;
	children?: ReactNode;
}

export function GridItem({span = 1, className = '', children}: GridItemProps) {
	const colSpan = {
		1: 'col-span-1',
		2: 'col-span-2',
		3: 'col-span-3',
		4: 'col-span-4',
		5: 'col-span-5',
		6: 'col-span-6',
	}

	return (
		<div
			className={twMerge(
				'min-w-0',
				colSpan[span],
				className,
			)}
		>
			{children}
		</div>
	);
}