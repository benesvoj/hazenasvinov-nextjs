'use client';

interface AdminContentProps {
  children: React.ReactNode;
}

export const AdminContent = ({children}: AdminContentProps) => {
  return <div className="w-full">{children}</div>;
};
