'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  paramName?: string;
  searchParams?: { [key: string]: string | string[] | undefined };
}

export function Pagination({
  currentPage,
  totalPages,
  paramName = 'page',
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams as any);
    params.set(paramName, pageNumber.toString());
    return `?${params.toString()}`;
  };

  const prevPage = currentPage > 1 ? createPageURL(currentPage - 1) : null;
  const nextPage = currentPage < totalPages ? createPageURL(currentPage + 1) : null;

  return (
    <div className="flex items-center justify-end gap-4 p-4 border-t border-gray-200 bg-gray-50">
      <span className="text-sm text-gray-700">
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <Link href={prevPage ?? '#'} aria-disabled={!prevPage} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${!prevPage ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
        <Link href={nextPage ?? '#'} aria-disabled={!nextPage} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ${!nextPage ? 'pointer-events-none opacity-50' : 'hover:bg-gray-50'}`}>
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}