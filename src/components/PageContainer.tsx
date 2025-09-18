import {useState} from 'react';
import {Card, CardBody, Tabs, Tab, Alert} from '@heroui/react';
import {useUserRoles} from '@/hooks';
import {useCategories} from '@/hooks';

export interface PageContainerProps {
  children: React.ReactNode;
  isUnderConstruction?: boolean;
}

export default function PageContainer({children, isUnderConstruction = false}: PageContainerProps) {
  return (
    <div className="space-y-2 sm:space-y-6 w-full mt-4 sm:mt-18">
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
