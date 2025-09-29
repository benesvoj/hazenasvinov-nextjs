interface AdminContentProps {
  children: React.ReactNode;
}

export const AdminContent = ({children}: AdminContentProps) => {
  return <div className="space-y-4">{children}</div>;
};
