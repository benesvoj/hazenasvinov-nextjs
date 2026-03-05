import {Input, Textarea} from '@heroui/input';

import {translations} from '@/lib/translations';

import {Choice, Dialog} from '@/components';
import {getTodoCategoriesOptions, getTodoPrioritiesOptions, ModalMode} from '@/enums';
import {TodoItem, TodoModalProps} from '@/types';

export const TodoModal = ({
  isOpen,
  onSubmit,
  onClose,
  todoFormData,
  setTodoFormData,
  mode,
  isLoading,
}: TodoModalProps) => {
  const tTodoModal = translations.todos.todoModal;

  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? tTodoModal.titleEdit : tTodoModal.titleAdd;
  const confirmButtonLabel = isEditMode
    ? translations.common.actions.save
    : translations.common.actions.add;

  const prioritiesOptions = getTodoPrioritiesOptions().map((c) => ({key: c.value, label: c.label}));
  const categoriesOptions = getTodoCategoriesOptions().map((c) => ({key: c.value, label: c.label}));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      title={modalTitle}
      isLoading={isLoading}
      submitButtonLabel={confirmButtonLabel}
    >
      <Input
        size="sm"
        label={tTodoModal.title}
        aria-label={tTodoModal.title}
        value={todoFormData.title}
        onChange={(e) => setTodoFormData({...todoFormData, title: e.target.value})}
        isRequired
        placeholder={tTodoModal.titlePlaceholder}
      />
      <Textarea
        size="sm"
        label={tTodoModal.description}
        aria-label={tTodoModal.description}
        value={todoFormData.description || ''}
        onChange={(e) => setTodoFormData({...todoFormData, description: e.target.value})}
        placeholder={tTodoModal.descriptionPlaceholder}
      />
      <div className="grid grid-cols-2 gap-4">
        <Choice
          label={tTodoModal.priority}
          placeholder={tTodoModal.priorityPlaceholder}
          aria-label={tTodoModal.priority}
          value={todoFormData.priority}
          items={prioritiesOptions}
          onChange={(id) =>
            setTodoFormData({...todoFormData, priority: id as TodoItem['priority']})
          }
        />
        <Choice
          label={tTodoModal.category}
          placeholder={tTodoModal.categoryPlaceholder}
          aria-label={tTodoModal.category}
          items={categoriesOptions}
          value={todoFormData.category}
          onChange={(id) =>
            setTodoFormData({...todoFormData, category: id as TodoItem['category']})
          }
        />
        <Input
          size="sm"
          label={tTodoModal.dueDate}
          aria-label={tTodoModal.dueDate}
          type="date"
          isRequired
          value={todoFormData.due_date || ''}
          onChange={(e) => setTodoFormData({...todoFormData, due_date: e.target.value})}
        />
      </div>
    </Dialog>
  );
};
