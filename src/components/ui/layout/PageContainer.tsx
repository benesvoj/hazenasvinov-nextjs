import {Alert} from '@heroui/react';
export interface PageContainerProps {
  children: React.ReactNode;
  isUnderConstruction?: boolean;
}

export default function PageContainer({children, isUnderConstruction = false}: PageContainerProps) {
  return (
    <div className="space-y-2 sm:space-y-6 w-full mt-4 sm:mt-20">
      {isUnderConstruction && (
        <Alert
          color="warning"
          title="Upozornění"
          description="Tato stránka je v testovacím provozu. Některé funkce mohou být nedostupné nebo nefunkční."
        />
      )}
      {children}
    </div>
  );
}
