"use client";

import React from "react";
import { Pagination } from "@heroui/react";

interface VideoPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export function VideoPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: VideoPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-gray-600">
        Zobrazeno {startItem}-{endItem} z {totalItems} videí
      </div>
      
      <Pagination
        total={totalPages}
        page={currentPage}
        onChange={onPageChange}
        showControls
        showShadow
        color="primary"
        size="sm"
        classNames={{
          wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
          item: "w-8 h-8 text-small rounded-none bg-transparent",
          cursor: "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-300 dark:to-default-600 text-white font-bold",
        }}
      />
    </div>
  );
}
