import {AriaRole, ReactNode} from 'react';

import {twMerge} from 'tailwind-merge';

import {
  FlexboxAlign,
  FlexboxDirection,
  FlexboxJustify,
  gapClasses,
  Padding,
  paddingClasses,
  Spacing,
} from '@/types';
import {cn} from "@/shared/lib/cn";

export interface StackProps {
  role?: AriaRole;
  children: ReactNode;
  direction: FlexboxDirection;
  align?: FlexboxAlign;
  justify?: FlexboxJustify;
  wrap?: boolean;
  spacing?: Spacing;
  className?: string;
  padding?: Padding;
}

const directionClasses: Record<FlexboxDirection, string> = {
  row: 'flex-row',
  column: 'flex-col',
  'row-reverse': 'flex-row-reverse',
  'column-reverse': 'flex-col-reverse',
};

const justifyClasses: Record<FlexboxJustify, string> = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  stretch: 'justify-stretch',
  baseline: 'justify-baseline',
  around: 'justify-around',
  between: 'justify-between',
};

const alignClasses: Record<FlexboxAlign, string> = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

export function Stack(props: StackProps) {
  return (
    <div
      role={props.role}
      className={cn(
        'flex',
        directionClasses[props.direction ?? 'row'],
        justifyClasses[props.justify ?? 'start'],
        alignClasses[props.align ?? 'center'],
        props.wrap ? 'flex-wrap' : 'flex-nowrap',
        gapClasses[props.spacing ?? 0],
        paddingClasses[props.padding ?? 0],
        props.className
      )}
    >
      {props.children}
    </div>
  );
}

Stack.displayName = 'Stack';