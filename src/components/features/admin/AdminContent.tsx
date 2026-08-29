'use client';

interface AdminContentProps {
  children: React.ReactNode;
}

export const AdminContent = ({children}: AdminContentProps) => {
  return <div className="w-full space-y-2">{children}</div>;
};
