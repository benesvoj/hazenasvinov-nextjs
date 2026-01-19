'use client';

import {useState} from 'react';

import {
  Button,
  Chip,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {PencilIcon, PlusIcon, TrashIcon} from '@heroicons/react/24/outline';

import {useModal, useModalWithItem} from '@/hooks/useModals';

import {useAppData} from '@/contexts/AppDataContext';

import {DeleteConfirmationModal} from '@/components';
import {useCategoryMembershipFees, useFetchCategoryMembershipFees} from '@/hooks';
import {CategoryMembershipFee} from '@/types';

import CategoryFeeFormModal from './CategoryFeeFormModal';

const YEAR_RANGE_BEFORE = 5;
const YEAR_RANGE_AFTER = 5;
const YEAR_OPTIONS_LENGTH = YEAR_RANGE_BEFORE + YEAR_RANGE_AFTER;

export default function CategoryFeesTab() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const {data, loading: fetchLoading, refetch} = useFetchCategoryMembershipFees({selectedYear});
  const {
    categories: {data: categories},
  } = useAppData();
  const {fees, loading, deleteFee} = useCategoryMembershipFees(selectedYear);

  const modal = useModal();
  const deleteModal = useModalWithItem<CategoryMembershipFee>();

  const [selectedFee, setSelectedFee] = useState<CategoryMembershipFee | null>(null);

  // Generate year options (current year ± 5 years)
  const yearOptions = Array.from({length: YEAR_OPTIONS_LENGTH}, (_, i) => currentYear - 5 + i);

  const handleEdit = (fee: CategoryMembershipFee) => {
    setSelectedFee(fee);
    modal.onOpen();
  };

  const handleDelete = async () => {
    if (selectedFee) {
      await deleteFee(selectedFee.id);
      deleteModal.onClose();
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
            <SelectItem key={year.toString()} textValue={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </Select>

        <Button
          color="primary"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={() => {
            setSelectedFee(null);
            modal.onOpen();
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
          items={data}
          isLoading={fetchLoading}
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
                        deleteModal.onOpen();
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
        isOpen={modal.isOpen}
        onClose={modal.onClose}
        fee={selectedFee}
        categories={categories || []}
        defaultYear={selectedYear}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleDelete}
        title="Smazat členský poplatek"
        message="Opravdu chcete smazat tento členský poplatek?"
      />
    </div>
  );
}
