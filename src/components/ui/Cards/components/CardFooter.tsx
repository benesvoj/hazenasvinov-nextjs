import React from "react";

import {CardFooter as HeroCardFooter} from "@heroui/card";

import {twMerge} from "tailwind-merge";

interface CardFooterProps {
	children: React.ReactNode;
	className?: string;
	justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
}

export function CardFooter({children, className = '', justify = 'between'}: CardFooterProps) {
	const justifyClasses = {
		start: 'justify-start',
		center: 'justify-center',
		end: 'justify-end',
		between: 'justify-between',
		around: 'justify-around',
		evenly: 'justify-evenly',
	};

	return (
		<HeroCardFooter className={twMerge(`px-4 sm:px-6 py-4 ${justifyClasses[justify]} ${className}`)}>
			{children}
		</HeroCardFooter>
	);
}