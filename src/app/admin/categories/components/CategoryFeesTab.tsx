'use client';

import {useState} from 'react';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Select,
  SelectItem,
  useDisclosure,
  Chip,
} from '@heroui/react';

import {PlusIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {useAppData} from '@/contexts/AppDataContext';

import {DeleteConfirmationModal} from '@/components';
import {useCategoryFees} from '@/hooks';
import {CategoryMembershipFee} from '@/types';

import CategoryFeeFormModal from './CategoryFeeFormModal';

export default function CategoryFeesTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const {categories} = useAppData();
  const {fees, loading, deleteFee} = useCategoryFees(selectedYear);

  const {isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose} = useDisclosure();

  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

  const [selectedFee, setSelectedFee] = useState<CategoryMembershipFee | null>(null);

  // Generate year options (current year ± 5 years)
  const yearOptions = Array.from({length: 11}, (_, i) => currentYear - 5 + i);

  const handleEdit = (fee: CategoryMembershipFee) => {
    setSelectedFee(fee);
    onFormOpen();
  };

  const handleDelete = async () => {
    if (selectedFee) {
      await deleteFee(selectedFee.id);
      onDeleteClose();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Year Selector and Add Button */}
      <div className="flex justify-between items-center">
        <Select
          label="Kalendářní rok"
          selectedKeys={[selectedYear.toString()]}
          onSelectionChange={(keys) => setSelectedYear(parseInt(Array.from(keys)[0] as string))}
          className="max-w-xs"
        >
          {yearOptions.map((year) => (
            <SelectItem key={year.toString()}>{year}</SelectItem>
          ))}
        </Select>

        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={() => {
            setSelectedFee(null);
            onFormOpen();
          }}
        >
          Přidat poplatek
        </Button>
      </div>

      {/* Fees Table */}
      <Table aria-label="Členské poplatky">
        <TableHeader>
          <TableColumn>KATEGORIE</TableColumn>
          <TableColumn>ČÁSTKA</TableColumn>
          <TableColumn>OBDOBÍ</TableColumn>
          <TableColumn>POPIS</TableColumn>
          <TableColumn>STAV</TableColumn>
          <TableColumn>AKCE</TableColumn>
        </TableHeader>
        <TableBody
          items={fees}
          isLoading={loading}
          emptyContent={`Žádné poplatky pro rok ${selectedYear}`}
        >
          {(fee) => {
            const category = categories?.find((c) => c.id === fee.category_id);
            return (
              <TableRow key={fee.id}>
                <TableCell>{category?.name || 'Neznámá kategorie'}</TableCell>
                <TableCell>
                  {fee.fee_amount} {fee.currency}
                </TableCell>
                <TableCell>{fee.fee_period}</TableCell>
                <TableCell>{fee.description || '-'}</TableCell>
                <TableCell>
                  <Chip color={fee.is_active ? 'success' : 'default'} size="sm">
                    {fee.is_active ? 'Aktivní' : 'Neaktivní'}
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(fee)}>
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => {
                        setSelectedFee(fee);
                        onDeleteOpen();
                      }}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          }}
        </TableBody>
      </Table>

      {/* Modals */}
      <CategoryFeeFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        fee={selectedFee}
        categories={categories || []}
        defaultYear={selectedYear}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Smazat členský poplatek"
        message="Opravdu chcete smazat tento členský poplatek?"
      />
    </div>
  );
}
