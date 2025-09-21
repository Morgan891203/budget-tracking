'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Heart } from 'lucide-react';
import { createMomDebtTransaction } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-semibold text-white bg-pink-600 rounded-md hover:bg-pink-700 disabled:bg-gray-400"
    >
      {pending ? 'Saving...' : 'Add Transaction'}
    </button>
  );
}

interface MomDebtFormProps {
  selectedMonth: string;
  selectedYear: string;
}

const initialState: { message: string | null } = {
  message: null,
};

export function MomDebtForm({ selectedMonth, selectedYear }: MomDebtFormProps) {
  const [state, formAction] = useActionState(
    createMomDebtTransaction,
    initialState,
  );

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <form
      action={formAction}
      className="p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <div className="flex items-center gap-3">
        <Heart className="h-7 w-7 text-pink-500" />
        <h2 className="text-2xl font-semibold text-gray-800">
          Add Mom's Transaction
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="month-mom"
            className="block text-sm font-medium text-gray-700"
          >
            Month
          </label>
          <select
            id="month-mom"
            name="month"
            required
            defaultValue={selectedMonth}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          >
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="year-mom"
            className="block text-sm font-medium text-gray-700"
          >
            Year
          </label>
          <select
            id="year-mom"
            name="year"
            required
            defaultValue={selectedYear}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label
          htmlFor="mom-debt-description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <input
          type="text"
          id="mom-debt-description"
          name="description"
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
        />
      </div>

      <div>
        <label
          htmlFor="mom-debt-amount"
          className="block text-sm font-medium text-gray-700"
        >
          Amount
        </label>
        <input
          type="number"
          id="mom-debt-amount"
          name="amount"
          step="0.01"
          placeholder="0.00"
          required
          className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">
          Transaction Type
        </legend>
        <div className="mt-2 flex gap-x-6">
          <div className="flex items-center">
            <input
              id="mom-iOwe"
              name="type"
              type="radio"
              value="iOwe"
              defaultChecked
              className="focus:ring-pink-500 h-4 w-4 text-pink-600 border-gray-300"
            />
            <label
              htmlFor="mom-iOwe"
              className="ml-3 block text-sm font-medium text-gray-700"
            >
              I Owe Her
            </label>
          </div>
          <div className="flex items-center">
            <input
              id="mom-theyOwe"
              name="type"
              type="radio"
              value="theyOwe"
              className="focus:ring-pink-500 h-4 w-4 text-pink-600 border-gray-300"
            />
            <label
              htmlFor="mom-theyOwe"
              className="ml-3 block text-sm font-medium text-gray-700"
            >
              She Owes Me
            </label>
          </div>
        </div>
      </fieldset>

      <div className="pt-2">
        <SubmitButton />
      </div>
      {state?.message && (
        <p className="text-sm text-red-500">{state.message}</p>
      )}
    </form>
  );
}
