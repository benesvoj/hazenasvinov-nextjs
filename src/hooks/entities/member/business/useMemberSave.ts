import {Genders} from '@/enums';
import {useMembers, useModalWithItem} from '@/hooks';
import {Member} from '@/types';

export const useMemberSave = (
  memberModal: ReturnType<typeof useModalWithItem<Member>>,
  onSuccess: () => void
) => {
  const {createMember, updateMember} = useMembers();

  const handleSave = async (data: Member) => {
    if (memberModal.isEditMode) {
      await updateMember({
        id: memberModal.selectedItem!.id!,
        name: data.name,
        surname: data.surname,
        registration_number: data.registration_number ?? undefined,
        date_of_birth: data.date_of_birth ?? undefined,
        sex: data.sex ?? undefined,
        functions: data.functions ?? undefined,
        category_id: data.category_id ?? undefined,
        is_active: data.is_active ?? undefined,
      });
    } else {
      await createMember(
        {
          name: data.name,
          surname: data.surname,
          registration_number: data.registration_number ?? '',
          date_of_birth: data.date_of_birth ?? undefined,
          sex: data.sex ?? Genders.MALE,
          functions: data.functions ?? [],
        },
        data.category_id ?? undefined
      );
    }
    memberModal.closeAndClear();
    onSuccess();
  };
  return {
    handleSave,
  };
};
