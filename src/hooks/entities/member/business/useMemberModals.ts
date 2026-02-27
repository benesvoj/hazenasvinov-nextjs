import {useModal, useModalWithItem} from '@/hooks';

export const useMemberModals = <T extends {id: string | null}>() => {
  const addModal = useModal();
  const editModal = useModalWithItem<T>();
  const deleteModal = useModalWithItem<T>();
  const paymentModal = useModalWithItem<T>();
  const bulkEditModal = useModal();

  return {
    addModal,
    editModal,
    deleteModal,
    paymentModal,
    bulkEditModal,
  };
};
