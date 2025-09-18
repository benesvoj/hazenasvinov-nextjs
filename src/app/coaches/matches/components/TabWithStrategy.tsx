import {Card, CardBody, CardHeader, Button, Alert} from '@heroui/react';

export default function TabWithStrategy() {
  return (
    <div className="space-y-3 p-4 mx-1 sm:mx-2">
      <Alert
        title="Tato sekce je v testovacím provozu. Některé funkce mohou být nedostupné nebo nefunkční."
        color="warning"
      />
      <Card>
        <CardHeader className="pb-2">
          <h5 className="font-medium text-sm sm:text-base">Taktické poznámky</h5>
        </CardHeader>
        <CardBody className="pt-0">
          <textarea
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none"
            rows={3}
            placeholder="Zadejte taktické poznámky pro tento zápas..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h5 className="font-medium text-sm sm:text-base">Sestava</h5>
        </CardHeader>
        <CardBody className="pt-0">
          <textarea
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none"
            rows={3}
            placeholder="Plánovaná sestava..."
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <h5 className="font-medium text-sm sm:text-base">Příprava hráčů</h5>
        </CardHeader>
        <CardBody className="pt-0">
          <textarea
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md resize-none"
            rows={3}
            placeholder="Speciální příprava pro jednotlivé hráče..."
          />
        </CardBody>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 pt-4">
        <Button color="primary" size="sm" className="w-full sm:w-auto">
          Uložit poznámky
        </Button>
        <Button variant="light" size="sm" className="w-full sm:w-auto">
          Exportovat
        </Button>
      </div>
    </div>
  );
}
