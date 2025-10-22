import {useRouter} from 'next/navigation';

import {Button, Card, CardBody, CardHeader} from '@heroui/react';

import {useCategoryFees} from '@/hooks';

export default function CategoryFeeQuickView({categoryId}: {categoryId: string}) {
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const {fees} = useCategoryFees(currentYear);
  const currentFee = fees.find((f) => f.category_id === categoryId);

  return (
    <Card>
      <CardHeader>Členský poplatek {currentYear}</CardHeader>
      <CardBody>
        {currentFee ? (
          <>
            <p className="text-2xl font-bold">
              {currentFee.fee_amount} {currentFee.currency}
            </p>
            <p className="text-sm text-gray-500">{currentFee.fee_period}</p>
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                // Option 1: Open edit modal
                // setSelectedFee(currentFee);
                // onFeeEditOpen();
                console.log('Edit fee', currentFee.id);
                // OR Option 2: Navigate to fees tab
                // router.push('/admin/categories?tab=fees');
              }}
            >
              Upravit poplatek
            </Button>
          </>
        ) : (
          <>
            <p className="text-gray-500">Poplatek není nastaven</p>
            <Button
              size="sm"
              color="primary"
              onPress={() => {
                // Navigate to fees tab with category pre-selected
                router.push(`/admin/categories?tab=fees&category=${categoryId}`);
              }}
            >
              Nastavit poplatek
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}
