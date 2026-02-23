import {Spinner} from '@heroui/spinner';

import {translations} from '@/lib/translations/index';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
  label?: string;
}

/**
 * Renders a loading spinner with customizable size, color, and label.
 *
 * @param {Object} props - The properties object.
 * @param {'sm' | 'md' | 'lg'} [props.size='md'] - The size of the spinner. Can be 'sm', 'md', or 'lg'.
 * @param {'primary' | 'secondary' | 'tertiary'} [props.color='primary'] - The color of the spinner. Can be 'primary', 'secondary', or 'tertiary'.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the container element.
 * @param {string} [props.label=translations.common.loading] - Optional label text displayed below the spinner.
 * @return {JSX.Element} A JSX element displaying a loading spinner with an optional label.
 */
export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  label = translations.common.loading,
}: LoadingSpinnerProps): JSX.Element {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <Spinner size={size} color={color} />
      {label && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</p>}
    </div>
  );
}

/**
 * Displays a full-page spinner component, typically used to indicate loading state.
 *
 * @param {Object} options - The options for the FullPageSpinner component.
 * @param {string} [options.label=translations.common.fullPageLoading] - The loading label text to display.
 * @param {string} [options.className=''] - Additional CSS class names to apply to the spinner container.
 * @return {JSX.Element} A JSX element representing the full-page spinner.
 */
export function FullPageSpinner({
  label = translations.common.fullPageLoading,
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${className}`}>
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

/**
 * A functional component that renders an inline spinner.
 *
 * @param {Object} props - The props object.
 * @param {'sm' | 'md' | 'lg'} [props.size='sm'] - The size of the spinner. Options are 'sm', 'md', or 'lg'.
 * @param {string} [props.className=''] - Additional CSS classes to apply to the spinner container.
 * @return {JSX.Element} The rendered inline spinner component.
 */
export function InlineSpinner({
  size = 'sm',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <LoadingSpinner size={size} />
    </div>
  );
}
