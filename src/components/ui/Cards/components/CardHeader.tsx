import React from "react";

import {CardHeader as HeroCardHeader} from "@heroui/card";

import {twMerge} from "tailwind-merge";

interface CardHeaderProps {
	children: React.ReactNode;
	className?: string;
}

export function CardHeader({children, className}: CardHeaderProps) {
	return <HeroCardHeader className={twMerge(`${className}`)}>{children}</HeroCardHeader>
}
