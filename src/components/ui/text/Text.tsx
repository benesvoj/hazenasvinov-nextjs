import {AriaRole, ForwardedRef, forwardRef, ReactNode} from 'react';

import {useTheme} from 'next-themes';

import {Nullish} from '@/types';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextSize = 'large' | 'base' | 'small' | 'xSmall' | 'xxSmall';

interface TextProps {
  children?: string | ReactNode | Nullish;
  id?: string;
  title?: string;
  role?: AriaRole;
  inline?: true;
  align?: TextAlign;
  size?: TextSize;
}

export const Text = forwardRef((props: TextProps, ref: ForwardedRef<HTMLDivElement>) => {
  const theme = useTheme();

  return (
    <div
      ref={ref}
      id={props.id}
      title={props.title}
      role={props.role}
      className={`${props.inline ? 'inline' : 'block'} text-${theme.theme === 'dark' ? 'white' : 'black'} font-body text-${props.size ?? 'base'} leading-${props.size ?? 'base'} font-${props.inline ? 'alternative' : 'default'} ${props.align ? `text-${props.align}` : ''}`}
    >
      {props.children}
    </div>
  );
});

Text.displayName = 'Text';
