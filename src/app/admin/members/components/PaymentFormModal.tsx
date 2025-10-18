'use client';

import {useState, useEffect} from 'react';

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from '@heroui/react';

import {PaymentMethod, FeeType} from '@/enums/membershipFeeStatus';

import {useMemberPayments} from '@/hooks';
import {Member, MembershipFeePayment} from '@/types';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment?: MembershipFeePayment | null;
  member: Member;
  defaultYear: number;
}

export default function PaymentFormModal({
  isOpen,
  onClose,
  payment,
  member,
  defaultYear,
}: PaymentFormModalProps) {
  const {createPayment, updatePayment} = useMemberPayments(member.id);

  const [formData, setFormData] = useState({
    member_id: member.id,
    category_id: member.category_id || '',
    calendar_year: defaultYear,
    amount: '',
    currency: 'CZK',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: PaymentMethod.CASH,
    payment_reference: '',
    fee_type: FeeType.MEMBERSHIP,
    notes: '',
    receipt_number: '',
  });

  useEffect(() => {
    if (payment) {
      setFormData({
        member_id: payment.member_id,
        category_id: payment.category_id,
        calendar_year: payment.calendar_year,
        amount: payment.amount.toString(),
        currency: payment.currency,
        payment_date: payment.payment_date,
        payment_method: (payment.payment_method as PaymentMethod) || PaymentMethod.CASH,
        payment_reference: payment.payment_reference || '',
        fee_type: payment.fee_type as FeeType,
        notes: payment.notes || '',
        receipt_number: payment.receipt_number || '',
      });
    } else {
      setFormData({
        member_id: member.id,
        category_id: member.category_id || '',
        calendar_year: defaultYear,
        amount: '',
        currency: 'CZK',
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: PaymentMethod.CASH,
        payment_reference: '',
        fee_type: FeeType.MEMBERSHIP,
        notes: '',
        receipt_number: '',
      });
    }
  }, [payment, member, defaultYear]);

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (payment) {
        await updatePayment({...data, id: payment.id});
      } else {
        await createPayment(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save payment:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>{payment ? 'Upravit platbu' : 'Přidat platbu'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Kalendářní rok"
                value={formData.calendar_year.toString()}
                onChange={(e) =>
                  setFormData({...formData, calendar_year: parseInt(e.target.value)})
                }
                isRequired
              />

              <Input
                type="date"
                label="Datum platby"
                value={formData.payment_date}
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                isRequired
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Částka"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                isRequired
              />

              <Input
                label="Měna"
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
                isRequired
              />
            </div>

            <Select
              label="Typ platby"
              selectedKeys={[formData.fee_type]}
              onSelectionChange={(keys) =>
                setFormData({...formData, fee_type: Array.from(keys)[0] as FeeType})
              }
              isRequired
            >
              <SelectItem key={FeeType.MEMBERSHIP}>Členský poplatek</SelectItem>
              <SelectItem key={FeeType.REGISTRATION}>Registrační poplatek</SelectItem>
              <SelectItem key={FeeType.ADDITIONAL}>Dodatečný poplatek</SelectItem>
              <SelectItem key={FeeType.REFUND}>Vrácení</SelectItem>
            </Select>

            <Select
              label="Způsob platby"
              selectedKeys={[formData.payment_method]}
              onSelectionChange={(keys) =>
                setFormData({...formData, payment_method: Array.from(keys)[0] as PaymentMethod})
              }
            >
              <SelectItem key={PaymentMethod.CASH}>Hotovost</SelectItem>
              <SelectItem key={PaymentMethod.BANK_TRANSFER}>Bankovní převod</SelectItem>
              <SelectItem key={PaymentMethod.CARD}>Karta</SelectItem>
              <SelectItem key={PaymentMethod.OTHER}>Jiné</SelectItem>
            </Select>

            <Input
              label="Reference platby"
              value={formData.payment_reference}
              onChange={(e) => setFormData({...formData, payment_reference: e.target.value})}
              placeholder="Číslo transakce, šeku, atd."
            />

            <Input
              label="Číslo dokladu"
              value={formData.receipt_number}
              onChange={(e) => setFormData({...formData, receipt_number: e.target.value})}
              placeholder="Volitelné"
            />

            <Textarea
              label="Poznámka"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Volitelná poznámka k platbě"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {payment ? 'Uložit' : 'Přidat'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
