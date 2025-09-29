interface AdminContentProps {
  children: React.ReactNode;
}

export const AdminContent = ({children}: AdminContentProps) => {
  return (
    <div className="w-full">
      <div className="space-y-4">{children}</div>
    </div>
  );
};
