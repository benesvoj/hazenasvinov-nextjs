'use client';

import React from 'react';

import {
  Input,
  Textarea,
  Select,
  SelectItem,
  Checkbox,
  Switch,
  RadioGroup,
  Radio,
} from '@heroui/react';

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  disabled?: boolean;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'date' | 'time';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: {value: string; label: string; disabled?: boolean}[];
  placeholder?: string;
}

interface CheckboxFieldProps extends BaseFieldProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface SwitchFieldProps extends BaseFieldProps {
  type: 'switch';
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface RadioFieldProps extends BaseFieldProps {
  type: 'radio';
  value: string;
  onChange: (value: string) => void;
  options: {value: string; label: string; disabled?: boolean}[];
}

type FormFieldProps =
  | InputFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | SwitchFieldProps
  | RadioFieldProps;

export default function FormField(props: FormFieldProps) {
  const {label, required, error, helpText, className = '', disabled} = props;

  const renderField = () => {
    switch (props.type) {
      case 'textarea':
        return (
          <Textarea
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            maxLength={props.maxLength}
            isDisabled={disabled}
            variant={error ? 'bordered' : 'bordered'}
            color={error ? 'danger' : 'default'}
            className="w-full"
          />
        );

      case 'select':
        return (
          <Select
            selectedKeys={[props.value]}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0];
              if (selectedKey) props.onChange(String(selectedKey));
            }}
            placeholder={props.placeholder}
            isDisabled={disabled}
            variant={error ? 'bordered' : 'bordered'}
            color={error ? 'danger' : 'default'}
            className="w-full"
          >
            {props.options.map((option) => (
              <SelectItem key={option.value} isDisabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        );

      case 'checkbox':
        return (
          <Checkbox
            isSelected={props.checked}
            onValueChange={props.onChange}
            isDisabled={disabled}
            color={error ? 'danger' : 'primary'}
          >
            {label}
          </Checkbox>
        );

      case 'switch':
        return (
          <Switch
            isSelected={props.checked}
            onValueChange={props.onChange}
            isDisabled={disabled}
            color={error ? 'danger' : 'primary'}
          >
            {label}
          </Switch>
        );

      case 'radio':
        return (
          <RadioGroup
            value={props.value}
            onValueChange={props.onChange}
            isDisabled={disabled}
            color={error ? 'danger' : 'primary'}
            orientation="vertical"
          >
            {props.options.map((option) => (
              <Radio key={option.value} value={option.value} isDisabled={option.disabled}>
                {option.label}
              </Radio>
            ))}
          </RadioGroup>
        );

      default:
        return (
          <Input
            type={props.type}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.placeholder}
            min={props.min}
            max={props.max}
            step={props.step}
            isDisabled={disabled}
            variant={error ? 'bordered' : 'bordered'}
            color={error ? 'danger' : 'default'}
            className="w-full"
          />
        );
    }
  };

  // For checkbox and switch, we don't need a separate label
  if (props.type === 'checkbox' || props.type === 'switch') {
    return (
      <div className={`space-y-2 ${className}`}>
        {renderField()}
        {error && <p className="text-sm text-danger">{error}</p>}
        {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
      </div>
    );
  }

  // For radio, we don't need a separate label
  if (props.type === 'radio') {
    return (
      <div className={`space-y-2 ${className}`}>
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
        {renderField()}
        {error && <p className="text-sm text-danger">{error}</p>}
        {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-danger ml-1">*</span>}
      </label>
      {renderField()}
      {error && <p className="text-sm text-danger">{error}</p>}
      {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
}

// Responsive form grid component
interface FormGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function FormGrid({children, columns = 2, gap = 'md', className = ''}: FormGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gridGaps = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={`grid ${gridCols[columns]} ${gridGaps[gap]} ${className}`}>{children}</div>
  );
}

// Responsive form section component
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({title, description, children, className = ''}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
