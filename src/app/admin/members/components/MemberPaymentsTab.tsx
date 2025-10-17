'use client';

import React, {useState} from 'react';

import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Select,
  SelectItem,
  useDisclosure,
} from '@heroui/react';

import {PlusIcon, PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {getPaymentStatusColor, getPaymentStatusLabel} from '@/enums/membershipFeeStatus';

import {DeleteConfirmationModal} from '@/components';
import {useMemberPayments} from '@/hooks';
import {Member, MembershipFeePayment} from '@/types';

import PaymentFormModal from './PaymentFormModal';

interface MemberPaymentsTabProps {
  member: Member;
}

export default function MemberPaymentsTab({member}: MemberPaymentsTabProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const {payments, loading, deletePayment} = useMemberPayments(member.id, selectedYear);

  const {isOpen: isFormOpen, onOpen: onFormOpen, onClose: onFormClose} = useDisclosure();

  const {isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose} = useDisclosure();

  const [selectedPayment, setSelectedPayment] = useState<MembershipFeePayment | null>(null);

  // Calculate totals
  const totalPaid = payments
    .filter((p) => p.fee_type !== 'refund')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const totalRefunded = payments
    .filter((p) => p.fee_type === 'refund')
    .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);

  const netPaid = totalPaid - totalRefunded;

  // Year options
  const yearOptions = Array.from({length: 6}, (_, i) => currentYear - i);

  const handleEdit = (payment: MembershipFeePayment) => {
    setSelectedPayment(payment);
    onFormOpen();
  };

  const handleDelete = async () => {
    if (selectedPayment) {
      await deletePayment(selectedPayment.id);
      onDeleteClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ');
  };

  const formatAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Celkem zaplaceno</p>
            <p className="text-2xl font-bold text-success">{formatAmount(totalPaid, 'CZK')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Vráceno</p>
            <p className="text-2xl font-bold text-warning">{formatAmount(totalRefunded, 'CZK')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-gray-500">Čistá platba</p>
            <p className="text-2xl font-bold text-primary">{formatAmount(netPaid, 'CZK')}</p>
          </CardBody>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <Select
          label="Kalendářní rok"
          size="sm"
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
          size="sm"
          startContent={<PlusIcon className="w-5 h-5" />}
          onPress={() => {
            setSelectedPayment(null);
            onFormOpen();
          }}
        >
          Přidat platbu
        </Button>
      </div>

      {/* Payments Table */}
      <Table aria-label="Platby členského poplatku">
        <TableHeader>
          <TableColumn>DATUM</TableColumn>
          <TableColumn>ČÁSTKA</TableColumn>
          <TableColumn>TYP</TableColumn>
          <TableColumn>ZPŮSOB PLATBY</TableColumn>
          <TableColumn>REFERENCE</TableColumn>
          <TableColumn>POZNÁMKA</TableColumn>
          <TableColumn>AKCE</TableColumn>
        </TableHeader>
        <TableBody
          items={payments}
          isLoading={loading}
          emptyContent={`Žádné platby pro rok ${selectedYear}`}
        >
          {(payment) => (
            <TableRow key={payment.id}>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell>
                <span className={payment.fee_type === 'refund' ? 'text-danger' : ''}>
                  {payment.fee_type === 'refund' ? '-' : ''}
                  {formatAmount(payment.amount, payment.currency)}
                </span>
              </TableCell>
              <TableCell>
                <Chip size="sm" variant="flat">
                  {payment.fee_type}
                </Chip>
              </TableCell>
              <TableCell>{payment.payment_method || '-'}</TableCell>
              <TableCell>{payment.payment_reference || '-'}</TableCell>
              <TableCell>
                <span className="text-sm text-gray-600 line-clamp-1">{payment.notes || '-'}</span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button isIconOnly size="sm" variant="light" onPress={() => handleEdit(payment)}>
                    <PencilIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => {
                      setSelectedPayment(payment);
                      onDeleteOpen();
                    }}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modals */}
      <PaymentFormModal
        isOpen={isFormOpen}
        onClose={onFormClose}
        payment={selectedPayment}
        member={member}
        defaultYear={selectedYear}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        onConfirm={handleDelete}
        title="Smazat platbu"
        message="Opravdu chcete smazat tuto platbu?"
      />
    </div>
  );
}
