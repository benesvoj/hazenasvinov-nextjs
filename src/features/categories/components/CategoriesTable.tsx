'use client';

import React from "react";

import {translations} from "@/lib/translations";


import {getAgeGroupLabel, getGenderLabel, getStatusClasses, getStatusLabel} from "@/helpers/ui";

import {UnifiedTable} from "@/components";
import {ActionTypes} from "@/enums";
import {commonCopy} from "@/shared/copy";
import {Category} from "@/types";

interface CategoriesTableProps {
	data: Category[];
	isLoading: boolean;
	onEdit: (data: Category) => void;
	onDelete: (data: Category) => void;
}

export const CategoriesTable = ({data, isLoading, onEdit, onDelete}: CategoriesTableProps) => {
	const t = translations.categories;

	const categoryColumns = [
		{key: 'name', label: t.table.name},
		{key: 'description', label: t.table.description},
		{key: 'age_group', label: t.table.ageGroup},
		{key: 'gender', label: t.table.gender},
		{key: 'is_active', label: t.table.status},
		{key: 'sort_order', label: t.table.sortOrder},
		{
			key: 'actions',
			label: t.table.actions,
			isActionColumn: true,
			actions: [
				{type: ActionTypes.UPDATE, onPress: onEdit, title: commonCopy.actions.edit},
				{type: ActionTypes.DELETE, onPress: onDelete, title: commonCopy.actions.delete},
			],
		},
	];

	const renderCategoryCell = (category: Category, columnKey: string) => {
		switch (columnKey) {
			case 'name':
				return <span className="font-medium">{category.name}</span>;
			case 'description':
				return <span className="font-medium">{category.description || '-'}</span>;
			case 'age_group':
				return <span className="font-medium">{getAgeGroupLabel(category.age_group)}</span>;
			case 'gender':
				return <span className="font-medium">{getGenderLabel(category.gender)}</span>;
			case 'is_active':
				return (
					<span className={`font-medium ${getStatusClasses(category.is_active ?? false)}`}>
            {getStatusLabel(category.is_active ?? false)}
          </span>
				);
			case 'sort_order':
				return <span className="font-medium">{category.sort_order}</span>;
		}
	};

	return(
		<UnifiedTable
			columns={categoryColumns}
			isLoading={isLoading}
			data={data}
			ariaLabel={translations.categories.ariaLabels.table}
			renderCell={renderCategoryCell}
			getKey={(category: Category) => category.id}
			emptyContent={t.table.noCategories}
			isStriped
		/>
	)
}