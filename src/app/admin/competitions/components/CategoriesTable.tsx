import React, {useEffect, useState} from 'react';

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
  Skeleton,
  Input,
  Form,
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import {CategoryProps, ColumnType} from '@/types/types';

import {EditIcon} from '@/lib/icons';
import {translations} from '@/lib/translations';

import {ExtractDate} from '@/helpers/helper';

import {updateCategory} from '@/app/admin/actions/updateCategory';
import {
  COLUMN_ACTIONS,
  COLUMN_CREATED_AT,
  COLUMN_DESCRIPTION,
  COLUMN_ID,
  COLUMN_NAME,
  COLUMN_ROUTE,
  COLUMN_UPDATED_AT,
} from '@/app/admin/competitions/helpers/columns';

import {useFetchCategories} from '@/hooks';

type ActionsCellProps = {
  category: CategoryProps;
};

const ActionsCell: React.FC<ActionsCellProps> = ({category}) => {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const {categories} = translations;
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    route: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormValues({
        name: category.name,
        description: category.description || '',
        route: category.route || '',
      });
      setError(null);
    }
  }, [isOpen, category]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormValues((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const updateResult = await updateCategory({
        id: category.id,
        name: formValues.name,
        description: formValues.description,
        route: formValues.route,
      });

      if (updateResult.success) {
        setMessage('Category updated success');
      } else {
        setMessage(`Failed: ${updateResult.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // onOpenChange()

  return (
    <div className="relative flex items-center gap-2">
      <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
        <EditIcon onClick={onOpen} />
      </span>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} size="sm">
        <ModalContent>
          {(onClose) => (
            <>
              <Form onSubmit={handleSubmit}>
                <ModalHeader>{categories.edit}</ModalHeader>
                <ModalBody>
                  <p className={'text-xs'}>{categories.editDescription}</p>
                  {error && <div className="text-red-500 text-xs">{error}</div>}
                  {message && <div className="text-green-500 text-xs">{message}</div>}
                  <Input
                    label={categories.table.name}
                    labelPlacement="outside"
                    name="name"
                    value={formValues.name}
                    onChange={handleInputChange}
                    errorMessage={categories.table.nameError}
                    required
                  />
                  <Input
                    label={categories.table.description}
                    labelPlacement="outside"
                    name="description"
                    value={formValues.description}
                    onChange={handleInputChange}
                    errorMessage={categories.table.descriptionError}
                    required
                  />
                  <Input
                    label={categories.table.route}
                    labelPlacement="outside"
                    name="route"
                    value={formValues.route}
                    onChange={handleInputChange}
                    errorMessage={categories.table.routeError}
                    required
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color={'secondary'} onPress={onClose}>
                    {translations.action.cancel}
                  </Button>
                  <Button type="submit" color={'primary'} isLoading={loading}>
                    {translations.action.save}
                  </Button>
                </ModalFooter>
              </Form>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

const columns = [
  {key: COLUMN_ID, label: translations.categories.table.id},
  {key: COLUMN_NAME, label: translations.categories.table.name},
  {key: COLUMN_DESCRIPTION, label: translations.categories.table.description},
  {key: COLUMN_ROUTE, label: translations.categories.table.route},
  {key: COLUMN_UPDATED_AT, label: translations.categories.table.updatedAt},
  {key: COLUMN_CREATED_AT, label: translations.categories.table.createdAt},
  {key: COLUMN_ACTIONS, label: translations.categories.table.actions},
];

const columnRenders: Record<string, (item: CategoryProps) => React.ReactNode> = {
  [COLUMN_ID]: (item) => item.id,
  [COLUMN_NAME]: (item) => item.name,
  [COLUMN_DESCRIPTION]: (item) => item.description,
  [COLUMN_ROUTE]: (item) => item.route,
  [COLUMN_UPDATED_AT]: (item) => ExtractDate(item.updated_at),
  [COLUMN_CREATED_AT]: (item) => ExtractDate(item.created_at),
  [COLUMN_ACTIONS]: (item) => <ActionsCell category={item} />,
};

function renderCategoryCell(item: CategoryProps, columnKey: React.Key): React.ReactNode {
  if (typeof columnKey === 'string' && columnRenders[columnKey]) {
    return columnRenders[columnKey](item);
  }
  return typeof columnKey === 'string' && columnKey in item
    ? String((item as Record<string, unknown>)[columnKey])
    : null;
}

// helpers
const CategoriesTableLoading = () => <Skeleton />;
const CategoriesTableError = () => (
  <div className="text-red-500">{translations.error.fetchCategories}</div>
);

const ALIGN_CENTER = 'center';
const ALIGN_START = 'start';

function renderTableHeaderColumns(columns: ColumnType[]) {
  const TableHeaderColumn = (column: ColumnType) => (
    <TableColumn
      key={column.key}
      align={column.key === COLUMN_ACTIONS ? ALIGN_CENTER : ALIGN_START}
    >
      {column.label}
    </TableColumn>
  );
  TableHeaderColumn.displayName = 'TableHeaderColumn';
  return TableHeaderColumn;
}

function renderTableRows(items: CategoryProps[]) {
  const TableRowComponent = (item: CategoryProps) => (
    <TableRow key={item.id}>
      {(columnKey: React.Key) => <TableCell>{renderCategoryCell(item, columnKey)}</TableCell>}
    </TableRow>
  );
  TableRowComponent.displayName = 'TableRowComponent';
  return TableRowComponent;
}

export const CategoriesTable = () => {
  const {data: categories, loading, error} = useFetchCategories();

  if (loading) return <CategoriesTableLoading />;
  if (error) return <CategoriesTableError />;

  return (
    <Table aria-label={translations.categories.title}>
      <TableHeader columns={columns}>{renderTableHeaderColumns(columns)}</TableHeader>
      <TableBody items={categories}>{renderTableRows(categories)}</TableBody>
    </Table>
  );

  // return (
  // 	<Table aria-label={translations.category.title}>
  // 		<TableHeader columns={columns}>
  // 			{(column) => <TableColumn key={column.key} align={column.key === COLUMN_ACTIONS ? ALIGN_CENTER : ALIGN_START}>
  // 				{column.label}
  // 			</TableColumn>}
  // 		</TableHeader>
  // 		<TableBody items={data}>
  // 			{(item) => (
  // 				<TableRow key={item.id}>
  // 					{(columnKey) => <TableCell>{renderCategoryCell(item, columnKey)}</TableCell>}
  // 				</TableRow>
  // 			)}
  // 		</TableBody>
  // 	</Table>
  // )
};
