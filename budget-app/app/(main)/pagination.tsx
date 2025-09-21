
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  paramName: string;
  searchParams: { [key: string]: string | string[] | undefined };
};

export function Pagination({ currentPage, totalPages, paramName, searchParams }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handlePageChange = (page: number) => {
    const entries = Object.entries(searchParams).flatMap(([key, value]) => {
      if (value === undefined) {
        return [];
      }
      if (Array.isArray(value)) {
        return value.map((v) => [key, v]);
      }
      return [[key, value]];
    });
    const params = new URLSearchParams(entries);
    params.set(paramName, page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <span className="text-sm font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="p-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}