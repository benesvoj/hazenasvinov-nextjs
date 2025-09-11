/**
 * @description Heading component
 * @param param0 { size: HeadingLevel, children: React.ReactNode }
 * @returns React.ReactNode
 * @example
 * <Heading size={1}>Heading 1</Heading>
 * <Heading size={2}>Heading 2</Heading>
 * <Heading size={3}>Heading 3</Heading>
 * <Heading size={4}>Heading 4</Heading>
 * <Heading size={5}>Heading 5</Heading>
 * <Heading size={6}>Heading 6</Heading>
 */

import { Nullish } from "@/types";
import { useMemo } from "react";

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
