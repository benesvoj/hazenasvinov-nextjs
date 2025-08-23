'use client';

import { Input, Textarea } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { useState } from "react";

interface BaseFormFieldProps {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
}

interface InputFieldProps extends BaseFormFieldProps {
  type: "text" | "email" | "password" | "number" | "tel" | "url";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  minLength?: number;
}

interface TextareaFieldProps extends BaseFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
}

interface SelectFieldProps extends BaseFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

interface SwitchFieldProps extends BaseFormFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface CheckboxFieldProps extends BaseFormFieldProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface RadioFieldProps extends BaseFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; disabled?: boolean }[];
}

interface TagsFieldProps extends BaseFormFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

interface DateFieldProps extends BaseFormFieldProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}

// Input Field
export function InputField({
  label,
  name,
  type,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText,
  maxLength,
  minLength
}: InputFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        isDisabled={disabled}
        isInvalid={!!error}
        maxLength={maxLength}
        minLength={minLength}
        className="w-full"
      />
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Textarea Field
export function TextareaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText,
  rows = 4,
  maxLength
}: TextareaFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
      />
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Select Field
export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText
}: SelectFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          error ? 'border-red-300' : 'border-gray-300 dark:border-gray-600'
        } bg-white dark:bg-gray-800 text-gray-900 dark:text-white`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Switch Field
export function SwitchField({
  label,
  name,
  checked,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText
}: SwitchFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <Switch
          id={name}
          name={name}
          isSelected={checked}
          onValueChange={onChange}
          isDisabled={disabled}
          size="sm"
        />
      </div>
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Checkbox Field
export function CheckboxField({
  label,
  name,
  checked,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText
}: CheckboxFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start space-x-3">
        <Checkbox
          id={name}
          name={name}
          isSelected={checked}
          onValueChange={onChange}
          isDisabled={disabled}
          isInvalid={!!error}
        />
        
        <div className="flex-1">
          <label htmlFor={name} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
          
          {helpText && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{helpText}</p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 ml-6">{error}</p>
      )}
    </div>
  );
}

// Radio Field
export function RadioField({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText
}: RadioFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-2">
        {options.map((option) => (
          <label key={option.value} className="flex items-center space-x-2">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
              disabled={disabled || option.disabled}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
          </label>
        ))}
      </div>
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Tags Field
export function TagsField({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText,
  maxTags
}: TagsFieldProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAddTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      if (!maxTags || value.length < maxTags) {
        onChange([...value, inputValue.trim()]);
        setInputValue("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-3">
        {/* Tags Display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {value.map((tag, index) => (
              <Chip
                key={index}
                onClose={() => handleRemoveTag(tag)}
                variant="bordered"
                color="primary"
                size="sm"
              >
                {tag}
              </Chip>
            ))}
          </div>
        )}
        
        {/* Input for new tags */}
        {(!maxTags || value.length < maxTags) && (
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={placeholder || "Přidat tag..."}
              onKeyPress={handleKeyPress}
              isDisabled={disabled}
              size="sm"
              className="flex-1"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={!inputValue.trim() || disabled}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Přidat
            </button>
          </div>
        )}
      </div>
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

// Date Field
export function DateField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = "",
  helpText,
  min,
  max
}: DateFieldProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <Input
        id={name}
        name={name}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        isDisabled={disabled}
        isInvalid={!!error}
        className="w-full"
      />
      
      {helpText && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
