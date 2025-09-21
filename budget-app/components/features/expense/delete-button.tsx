'use client';

import { useFormStatus } from 'react-dom';
import { Trash2 } from 'lucide-react';

export function DeleteButton({ itemType = 'item' }: { itemType?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="p-1.5 text-red-500 rounded-md hover:bg-red-100 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
      aria-label={`Delete ${itemType}`}
    >
      {pending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-gray-400" /> : <Trash2 className="h-4 w-4" />}
    </button>
  );
}
