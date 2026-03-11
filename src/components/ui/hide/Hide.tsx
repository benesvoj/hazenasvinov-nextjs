import {ReactNode} from 'react';

export interface HideProps {
  children: ReactNode | ReactNode[];
  when?: unknown;
}

export const Hide = (props: HideProps) => {
  if (!!props.when) {
    return null;
  }

  return <>{props.children}</>;
};
