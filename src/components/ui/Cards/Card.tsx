'use client';

import React from 'react';

import {
  Card as HeroCard,
} from '@heroui/react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  isPressable?: boolean;
  onPress?: () => void;
  radius?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  isPressable = false,
  onPress,
  radius = 'lg',
  shadow = 'sm',
}: CardProps) {
  return (
    <HeroCard
      isPressable={isPressable}
      onPress={onPress}
      radius={radius}
      shadow={shadow}
      className={`w-full transition-all duration-200 ${isPressable ? 'hover:shadow-md' : ''} ${className}`}
    >
      {children}
    </HeroCard>
  );
}
