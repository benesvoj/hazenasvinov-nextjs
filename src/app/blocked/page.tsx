'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader } from '@heroui/react';
import { ShieldExclamationIcon, ArrowLeftIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export default function BlockedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-red-50 to-orange-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-6">
            <ShieldExclamationIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Přístup byl zablokován</h1>
          <p className="text-gray-600 text-sm">
            Váš účet byl dočasně zablokován administrátorem systému.
          </p>
        </CardHeader>
        <CardBody className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldExclamationIcon className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Proč byl účet zablokován?</h3>
                <p className="text-sm text-red-700 mt-1">
                  Možné důvody zahrnují porušení pravidel, bezpečnostní riziko nebo dočasné omezení přístupu.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <EnvelopeIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Jak získat zpět přístup?</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Kontaktujte administrátora systému nebo správce pro obnovení přístupu.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              color="primary" 
              variant="light" 
              onPress={() => router.push('/login')}
              className="w-full"
              startContent={<ArrowLeftIcon className="w-4 h-4" />}
            >
              Zpět na přihlášení
            </Button>
            
            <Button 
              variant="light" 
              onPress={() => router.push('/')}
              className="w-full"
            >
              Přejít na úvodní stránku
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Pokud se domníváte, že jde o omyl, kontaktujte podporu.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
