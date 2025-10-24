'use client';

import {useEffect, useState} from 'react';

import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from '@heroui/react';

import {FeePeriod} from '@/enums/membershipFeeStatus';

import {useCategoryMembershipFees} from '@/hooks';
import {Category, CategoryMembershipFee} from '@/types';

interface CategoryFeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  fee?: CategoryMembershipFee | null;
  categories: Category[];
  defaultYear: number;
}

export default function CategoryFeeFormModal({
  isOpen,
  onClose,
  fee,
  categories,
  defaultYear,
}: CategoryFeeFormModalProps) {
  const {createFee, updateFee} = useCategoryMembershipFees();

  const [formData, setFormData] = useState({
    category_id: '',
    calendar_year: defaultYear,
    fee_amount: '',
    currency: 'CZK',
    fee_period: FeePeriod.YEARLY,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    if (fee) {
      setFormData({
        category_id: fee.category_id,
        calendar_year: fee.calendar_year,
        fee_amount: fee.fee_amount.toString(),
        currency: fee.currency,
        fee_period: fee.fee_period as FeePeriod,
        description: fee.description || '',
        is_active: fee.is_active || false,
      });
    } else {
      setFormData({
        category_id: '',
        calendar_year: defaultYear,
        fee_amount: '',
        currency: 'CZK',
        fee_period: FeePeriod.YEARLY,
        description: '',
        is_active: true,
      });
    }
  }, [fee, defaultYear]);

  const handleSubmit = async () => {
    try {
      const data = {
        ...formData,
        fee_amount: parseFloat(formData.fee_amount),
      };

      if (fee) {
        await updateFee({...data, id: fee.id});
      } else {
        await createFee(data);
      }

      onClose();
    } catch (error) {
      console.error('Failed to save fee:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
      <ModalContent>
        <ModalHeader>{fee ? 'Upravit členský poplatek' : 'Přidat členský poplatek'}</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Select
              label="Kategorie"
              selectedKeys={formData.category_id ? [formData.category_id] : []}
              onSelectionChange={(keys) =>
                setFormData({...formData, category_id: Array.from(keys)[0] as string})
              }
              isRequired
            >
              {categories.map((cat) => (
                <SelectItem key={cat.id}>{cat.name}</SelectItem>
              ))}
            </Select>

            <Input
              type="number"
              label="Kalendářní rok"
              value={formData.calendar_year.toString()}
              onChange={(e) => setFormData({...formData, calendar_year: parseInt(e.target.value)})}
              isRequired
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                label="Částka"
                value={formData.fee_amount}
                onChange={(e) => setFormData({...formData, fee_amount: e.target.value})}
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
              label="Období"
              selectedKeys={[formData.fee_period]}
              onSelectionChange={(keys) =>
                setFormData({...formData, fee_period: Array.from(keys)[0] as FeePeriod})
              }
              isRequired
            >
              <SelectItem key={FeePeriod.YEARLY}>Ročně</SelectItem>
              <SelectItem key={FeePeriod.SEMESTER}>Pololetně</SelectItem>
              <SelectItem key={FeePeriod.QUARTERLY}>Čtvrtletně</SelectItem>
              <SelectItem key={FeePeriod.MONTHLY}>Měsíčně</SelectItem>
            </Select>

            <Textarea
              label="Popis"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Volitelný popis poplatku"
            />

            <Switch
              isSelected={formData.is_active}
              onValueChange={(value) => setFormData({...formData, is_active: value})}
            >
              Aktivní
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose}>
            Zrušit
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            {fee ? 'Uložit' : 'Přidat'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
