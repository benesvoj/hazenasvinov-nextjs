import React from "react";

import {twMerge} from "tailwind-merge";

interface CardGridProps {
	children: React.ReactNode;
	columns?: 1 | 2 | 3 | 4 | 5 | 6;
	gap?: 'sm' | 'md' | 'lg' | 'xl';
	className?: string;
}

export function Grid({children, columns = 3, gap = 'md', className = ''}: CardGridProps) {
	const gridCols = {
		1: 'grid-cols-1',
		2: 'grid-cols-1 sm:grid-cols-2',
		3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
		4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
		5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
		6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
	};

	const gridGaps = {
		sm: 'gap-2',
		md: 'gap-4',
		lg: 'gap-6',
		xl: 'gap-8',
	};

	return (
		<div className={twMerge(`grid ${gridCols[columns]} ${gridGaps[gap]} ${className}`)}>{children}</div>
	);
}