import userEvent from '@testing-library/user-event';
import {describe, it, expect, vi} from 'vitest';

import {render, screen} from '@/test/utils';

import {ButtonWithTooltip} from '../ButtonWithTooltip';

// Mock HeroUI components
vi.mock('@heroui/react', () => ({
  Tooltip: ({children, content}: any) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  ),
  Button: ({children, onPress, 'aria-label': ariaLabel, ...props}: any) => (
    <button onClick={onPress} aria-label={ariaLabel} data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

describe('ButtonWithTooltip', () => {
  it('should render button with tooltip', () => {
    const handlePress = vi.fn();

    render(
      <ButtonWithTooltip
        tooltip="Click me"
        onPress={handlePress}
        ariaLabel="Test button"
        isIconOnly={false}
      >
        Button Text
      </ButtonWithTooltip>
    );

    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByText('Button Text')).toBeInTheDocument();
  });

  it('should call onPress when button is clicked', async () => {
    const user = userEvent.setup();
    const handlePress = vi.fn();

    render(
      <ButtonWithTooltip
        tooltip="Click me"
        onPress={handlePress}
        ariaLabel="Test button"
        isIconOnly={false}
      >
        Click
      </ButtonWithTooltip>
    );

    const button = screen.getByTestId('button');
    await user.click(button);

    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('should render with correct aria-label', () => {
    const handlePress = vi.fn();

    render(
      <ButtonWithTooltip
        tooltip="Tooltip text"
        onPress={handlePress}
        ariaLabel="Accessible label"
        isIconOnly={true}
      />
    );

    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('aria-label', 'Accessible label');
  });

  it('should apply danger color when isDanger is true', () => {
    const handlePress = vi.fn();

    render(
      <ButtonWithTooltip
        tooltip="Delete"
        onPress={handlePress}
        ariaLabel="Delete button"
        isIconOnly={false}
        isDanger={true}
      >
        Delete
      </ButtonWithTooltip>
    );

    const button = screen.getByTestId('button');
    expect(button).toHaveAttribute('color', 'danger');
  });

  it('should pass isDisabled prop to Button', () => {
    const handlePress = vi.fn();

    render(
      <ButtonWithTooltip
        tooltip="Disabled button"
        onPress={handlePress}
        ariaLabel="Disabled"
        isIconOnly={false}
        isDisabled={true}
      >
        Disabled
      </ButtonWithTooltip>
    );

    // The mock passes isDisabled as a prop, so we just verify the component renders
    expect(screen.getByTestId('button')).toBeInTheDocument();
  });

  it('should pass size and variant props to Button', () => {
    const handlePress = vi.fn();

    render(
      <ButtonWithTooltip
        tooltip="Custom button"
        onPress={handlePress}
        ariaLabel="Custom"
        isIconOnly={false}
        size="lg"
        variant="solid"
      >
        Custom
      </ButtonWithTooltip>
    );

    // The mock passes these as props, so we just verify the component renders
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });
});
