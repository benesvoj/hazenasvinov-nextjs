import {Heading} from '@/components';

interface AdminHeaderProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export const AdminHeader = ({title, description, icon}: AdminHeaderProps) => {
  return (
    <div className="flex flex-col gap-2">
      {title && (
        <Heading size={1}>
          {icon && icon}
          {title}
        </Heading>
      )}
      {description && <p className="text-gray-600 dark:text-gray-400">{description}</p>}
    </div>
  );
};
