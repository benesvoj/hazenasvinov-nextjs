import {Input} from '@heroui/react';

export const MatchResultInput = ({
  label,
  value,
  onChange,
  isDisabled,
  color,
  errorMessage,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  isDisabled: boolean;
  color?: 'danger' | 'default';
  errorMessage?: string | undefined;
}) => {
  return (
    <div className="flex-1 w-full">
      <Input
        type="number"
        min="0"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        label={label}
        value={value === 0 ? '' : value.toString()}
        onChange={(e) => {
          const inputValue = e.target.value;
          const numValue =
            inputValue === '' ? 0 : isNaN(Number(inputValue)) ? 0 : Number(inputValue);
          onChange(numValue);
        }}
        isDisabled={isDisabled}
        classNames={{
          base: 'w-[150px]',
        }}
        color={color}
        errorMessage={errorMessage}
      />
    </div>
  );
};
