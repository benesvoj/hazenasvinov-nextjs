'use client';

import React, { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  Input,
  Chip,
  Card,
  CardBody
} from "@heroui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  mobilePriority?: number; // Higher number = higher priority on mobile
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  searchable?: boolean;
  sortable?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export default function DataTable<T extends Record<string, any>>({
  data,
  columns,
  itemsPerPage = 10,
  searchable = true,
  sortable = true,
  onRowClick,
  emptyMessage = "Žádná data k zobrazení",
  className = ""
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return sortedData.slice(start, end);
  }, [sortedData, page, itemsPerPage]);

  const pages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (columnKey: string) => {
    if (!sortable) return;
    
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(columnKey);
      setSortDirection("asc");
    }
  };

  const renderCell = (item: T, column: Column<T>) => {
    const value = item[column.key];
    
    if (column.render) {
      return column.render(value, item);
    }
    
    return value;
  };

  // Sort columns by mobile priority for mobile view
  const sortedColumns = useMemo(() => {
    return [...columns].sort((a, b) => (b.mobilePriority || 0) - (a.mobilePriority || 0));
  }, [columns]);

  // Mobile card view
  const renderMobileCard = (item: T) => (
    <Card 
      key={JSON.stringify(item)} 
      className="w-full cursor-pointer hover:shadow-md transition-shadow"
      isPressable={!!onRowClick}
      onPress={() => onRowClick?.(item)}
    >
      <CardBody className="p-4">
        <div className="space-y-3">
          {sortedColumns.slice(0, 3).map((column) => (
            <div key={column.key} className="flex justify-between items-start">
              <span className="text-sm font-medium text-gray-600 min-w-0 flex-1">
                {column.label}:
              </span>
              <div className="text-sm text-gray-900 text-right min-w-0 flex-1 ml-2">
                {renderCell(item, column)}
              </div>
            </div>
          ))}
          {sortedColumns.length > 3 && (
            <div className="pt-2 border-t border-gray-100">
              <Chip size="sm" variant="flat" color="primary">
                +{sortedColumns.length - 3} dalších polí
              </Chip>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {searchable && (
          <div className="w-full sm:w-80">
            <Input
              placeholder="Hledat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
              size="sm"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {filteredData.length} záznamů
          </span>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block lg:hidden">
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedData.map(renderMobileCard)}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <Table
          aria-label="Data table"
          selectionMode="none"
          onRowAction={(key) => {
            const item = paginatedData.find((_, index) => index === Number(key));
            if (item) onRowClick?.(item);
          }}
        >
          <TableHeader columns={columns}>
            {(column) => (
              <TableColumn
                key={column.key}
                allowsSorting={sortable && column.sortable !== false}
                className="cursor-pointer"
              >
                <div 
                  className="flex items-center gap-2"
                  onClick={() => handleSort(column.key)}
                >
                  {column.label}
                  {sortColumn === column.key && (
                    <span className="text-blue-500">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </TableColumn>
            )}
          </TableHeader>
          <TableBody
            items={paginatedData}
            emptyContent={emptyMessage}
          >
            {(item) => (
              <TableRow
                key={JSON.stringify(item)}
                className={onRowClick ? "cursor-pointer hover:bg-gray-50" : ""}
              >
                {(columnKey) => {
                  const column = columns.find((col) => col.key === columnKey);
                  if (!column) return <TableCell key={String(columnKey)}>-</TableCell>;
                  
                  return (
                    <TableCell key={String(columnKey)}>
                      {renderCell(item, column)}
                    </TableCell>
                  );
                }}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={pages}
            page={page}
            onChange={setPage}
            showControls
            size="sm"
            className="gap-2"
          />
        </div>
      )}
    </div>
  );
}
