'use client';

import {Checkbox, cn} from '@heroui/react';

export const CustomCheckbox = (props: any) => {
  const {children, ...otherProps} = props;

  return (
    <Checkbox
      {...otherProps}
      classNames={{
        base: cn(
          'inline-flex max-w-md w-full bg-content1 m-0',
          'hover:bg-content2 items-center justify-start',
          'cursor-pointer rounded-lg gap-2 p-4 border-2 border-transparent',
          'data-[selected=true]:border-primary'
        ),
        label: 'w-full',
      }}
    >
      <div className="w-full flex justify-between gap-2">{children}</div>
    </Checkbox>
  );
};
