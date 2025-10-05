export interface ActionItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isDisabled?: boolean;
  onClick: () => void;
  description?: string;
}
