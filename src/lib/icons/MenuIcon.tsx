import {IconSvgProps} from '@/lib/icons/types';

export const MenuIcon = ({size = 24, width, height, ...props}: IconSvgProps) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height={size || height}
      role="presentation"
      viewBox="0 0 24 24"
      width={size || width}
      {...props}
    >
      <path stroke="currentColor" strokeLinecap="round" strokeWidth={1.75} d="M4 6h16" />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth={1.75} d="M4 12h10" />
      <path stroke="currentColor" strokeLinecap="round" strokeWidth={1.75} d="M4 18h7" />
    </svg>
  );
};
