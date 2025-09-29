import {Input, Select, SelectItem, Textarea, Button} from '@heroui/react';

import {TodoItem, TodoModalProps} from '@/types/components/todo';

import {UnifiedModal} from '@/components';
import {getTodoCategoriesOptions, getTodoPrioritiesOptions, ModalMode} from '@/enums';
import {translations} from '@/lib';

export const TodoModal = ({
  isOpen,
  onSubmit,
  onClose,
  todoFormData,
  setTodoFormData,
  mode,
}: TodoModalProps) => {
  const t = translations.button;
  const tTodoModal = translations.common.todoModal;

  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? tTodoModal.titleEdit : tTodoModal.titleAdd;

  return (
    <UnifiedModal
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose}>
            {t.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit}>
            {isEditMode ? t.save : t.add}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label={tTodoModal.title}
          aria-label={tTodoModal.title}
          value={todoFormData.title}
          onChange={(e) => setTodoFormData({...todoFormData, title: e.target.value})}
          isRequired
          placeholder={tTodoModal.titlePlaceholder}
        />
        <Textarea
          label={tTodoModal.description}
          aria-label={tTodoModal.description}
          value={todoFormData.description}
          onChange={(e) => setTodoFormData({...todoFormData, description: e.target.value})}
          placeholder={tTodoModal.descriptionPlaceholder}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label={tTodoModal.priority}
          placeholder={tTodoModal.priorityPlaceholder}
          aria-label={tTodoModal.priority}
          selectedKeys={todoFormData.priority ? [todoFormData.priority] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as TodoItem['priority'];
            if (selectedKey) {
              setTodoFormData({
                ...todoFormData,
                priority: selectedKey,
              });
            }
          }}
        >
          {getTodoPrioritiesOptions().map(({value, label}) => (
            <SelectItem key={value}>{label}</SelectItem>
          ))}
        </Select>
        <Select
          label={tTodoModal.category}
          placeholder={tTodoModal.categoryPlaceholder}
          aria-label={tTodoModal.category}
          selectedKeys={todoFormData.category ? [todoFormData.category] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as TodoItem['category'];
            if (selectedKey) {
              setTodoFormData({
                ...todoFormData,
                category: selectedKey,
              });
            }
          }}
        >
          {getTodoCategoriesOptions().map(({value, label}) => (
            <SelectItem key={value}>{label}</SelectItem>
          ))}
        </Select>
        <Input
          label={tTodoModal.dueDate}
          aria-label={tTodoModal.dueDate}
          type="date"
          isRequired
          value={todoFormData.due_date}
          onChange={(e) => setTodoFormData({...todoFormData, due_date: e.target.value})}
        />
      </div>
    </UnifiedModal>
  );
};
