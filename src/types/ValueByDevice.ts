export type ValueByDevice<T> =
  | [mobile: T]
  | [mobile: T, tablet: T]
  | [mobile: T, tablet: T, notebook: T]
  | [mobile: T, tablet: T, notebook: T, desktop: T]
  | [mobile: T, tablet: T, notebook: T, desktop: T, print: T];
