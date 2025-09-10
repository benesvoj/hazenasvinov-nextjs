import { Nullish } from "@/types";
import { useMemo } from "react";

/**
 * @description Headings component, NEEDS to be analysed
 * @param param0 { children: React.ReactNode }
 * @returns React.ReactNode
 */

export const Heading1 = ({ children }: { children: React.ReactNode }) => {
  return (
    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
      {children}
    </h1>
  );
};

export const Heading2 = ({ children }: { children: React.ReactNode }) => {
  return (
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 my-4">
      {children}
    </h2>
  );
};

export const Heading3 = ({ children }: { children: React.ReactNode }) => {
  return (
    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  );
};

export const Heading4 = ({ children }: { children: React.ReactNode }) => {
  return (
    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 py-4">
      {children}
    </h4>
  );
};

export const Heading5 = ({ children }: { children: React.ReactNode }) => {
  return (
    <h5 className="text-sm font-bold text-gray-900 dark:text-gray-100">
      {children}
    </h5>
  );
};

export const Heading6 = ({ children }: { children: React.ReactNode }) => {
  return (
    <h6 className="text-xs font-bold text-gray-900 dark:text-gray-100">
      {children}
    </h6>
  );
};

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingAlign = "start" | "center" | "end";
export interface HeadingProps {
  isSingleLine?: boolean;
  alternative?: true;
  size: HeadingLevel;
  children?: Nullish | string | React.ReactNode;
  overflowWrap?: "anywhere";
  align?: HeadingAlign;
  isInline?: boolean;
}

export function Heading(props: HeadingProps) {

  const HeadingComponent = `h${props.size}` as keyof JSX.IntrinsicElements;

  const headingClass = useMemo(() => {switch (props.size) {
    case 1: return 'text-2xl font-semibold'
    case 2: return 'text-xl font-semibold'
    case 3: return 'text-lg font-semibold'
    case 4: return 'text-md font-medium mb-3 flex items-center gap-2'
    case 5: return 'text-sm font-medium'
    case 6: return 'text-xs font-bold'
  }}, [props.size]);

  return (
    <HeadingComponent
      aria-level={props.size}
      className={`
        text-gray-900 dark:text-gray-100
        ${headingClass}
        ${props.isSingleLine ? "whitespace-nowrap" : ""}
        ${props.alternative ? "font-semibold" : "font-bold"}
        ${props.overflowWrap ? "overflow-wrap-" + props.overflowWrap : ""}
        ${props.align ? "text-" + props.align : ""}
        ${props.isInline ? "inline" : "block"}
        `}
    >
      {props.children}
    </HeadingComponent>
  );
}
