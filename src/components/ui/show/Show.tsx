import {ReactNode} from 'react';

import {has} from 'ramda';
import {isFalse, isNull, isUndefined} from 'ramda-adjunct';

export interface ShowProps {
  children: ReactNode | ReactNode[];
  when?: unknown;
}

export const Show = (props: ShowProps) => {
  const hasWhen = has('when', props);

  if (isNull(props.when) || (hasWhen && isUndefined(props.when)) || isFalse(props.when)) {
    return null;
  }

  return <>{props.children}</>;
};
