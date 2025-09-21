'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { FilePenLine } from 'lucide-react';
import { updateExpense } from '@/lib/actions';
import type { Expense } from '@prisma/client';
import { format } from 'date-fns';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
    >
      {pending ? 'Saving...' : 'Save Changes'}
    </button>
  );
}

const biltExpenseDetails = [
    'Rent',
    'Dining',
    'Gym',
    'Grocery',
    'Youtube',
    'Travel',
    'Lyft',
    'Food Delivery',
    'Others'
];

type PlainExpense = Omit<Expense, 'amount'> & {
  amount: number;
};

export function EditExpense({ expense }: { expense: PlainExpense }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUpdateExpense = async (formData: FormData) => {
    await updateExpense(formData);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-blue-600 rounded-md hover:bg-blue-100 hover:text-blue-800"
        aria-label="Edit expense"
      >
        <FilePenLine className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Edit Expense</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            <form action={handleUpdateExpense} className="space-y-4">
              <input type="hidden" name="id" value={expense.id} />
              
              <div>
                <label htmlFor={`amount-${expense.id}`} className="block text-sm font-medium text-gray-700">Amount</label>
                <input
                  type="number"
                  id={`amount-${expense.id}`}
                  name="amount"
                  step="0.01"
                  defaultValue={expense.amount}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {expense.category === 'Bilt' ? (
                <div>
                  <label htmlFor={`description-${expense.id}`} className="block text-sm font-medium text-gray-700">Description</label>
                  <select
                    id={`description-${expense.id}`}
                    name="description"
                    defaultValue={expense.description}
                    required
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    {biltExpenseDetails.map((detail) => (
                      <option key={detail} value={detail}>{detail}</option>
                    ))}
                  </select>
                </div>
              ) : (
                 <input type="hidden" name="description" value={expense.description} />
              )}
              
              <div>
                <label htmlFor={`date-${expense.id}`} className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  id={`date-${expense.id}`}
                  name="date"
                  defaultValue={format(expense.date, 'yyyy-MM-dd')}
                  required
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="w-full px-4 py-2 font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
