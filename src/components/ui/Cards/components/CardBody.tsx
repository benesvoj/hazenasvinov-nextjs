import React from "react";

import {CardBody as HeroCardBody,} from "@heroui/card";

import {twMerge} from "tailwind-merge";


interface CardBodyProps {
	children: React.ReactNode;
	className?: string;
	padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function CardBody({children, className = '', padding = 'sm'}: CardBodyProps) {
	const paddingClasses = {
		none: '',
		sm: 'px-3 py-3',
		md: 'px-4 sm:px-6 py-4',
		lg: 'px-6 sm:px-8 py-6',
	};

	return (
		<HeroCardBody className={twMerge(`${paddingClasses[padding]} ${className}`)}>{children}</HeroCardBody>
	);
}