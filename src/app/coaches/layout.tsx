import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Coaches Portal - TJ Sokol Svinov',
  description: 'Portal pro trenéry týmů TJ Sokol Svinov',
};

export default function CoachesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
