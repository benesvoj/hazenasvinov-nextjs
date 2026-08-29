'use client';

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

import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {useAppData} from '@/contexts/AppDataContext';

import {HStack, VStack} from '@/components';
import {useFetchCategoryMembershipFees} from '@/hooks';
import {CategoryMembershipFee} from '@/types';

const YEAR_RANGE_BEFORE = 5;
const YEAR_RANGE_AFTER = 5;
const YEAR_OPTIONS_LENGTH = YEAR_RANGE_BEFORE + YEAR_RANGE_AFTER;

interface Props {
  selectedYear: number;
  onYearChange: (year: number) => void;
  onEdit: (fee: CategoryMembershipFee) => void;
  onDelete: (fee: CategoryMembershipFee) => void;
}

export default function CategoryFeesTab({selectedYear, onYearChange, onEdit, onDelete}: Props) {
  const currentYear = new Date().getFullYear();

  const {data, loading: fetchLoading, refetch} = useFetchCategoryMembershipFees({selectedYear});
  const {
    categories: {data: categories},
  } = useAppData();

  const yearOptions = Array.from({length: YEAR_OPTIONS_LENGTH}, (_, i) => currentYear - 5 + i);

  return (
    <VStack spacing={4} align="stretch" className={'w-full'}>
      <HStack justify={'between'}>
        <Select
          label="Kalendářní rok"
          selectedKeys={[selectedYear.toString()]}
          onSelectionChange={(keys) => onYearChange(parseInt(Array.from(keys)[0] as string))}
          className="max-w-xs"
        >
          {yearOptions.map((year) => (
            <SelectItem key={year.toString()} textValue={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </Select>
      </HStack>

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
                    <Button isIconOnly size="sm" variant="light" onPress={() => onEdit(fee)}>
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => onDelete(fee)}
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
    </VStack>
  );
}
