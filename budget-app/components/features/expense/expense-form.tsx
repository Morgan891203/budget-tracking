'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Receipt } from 'lucide-react';
import { createExpense } from '@/lib/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {pending ? 'Adding...' : 'Add Expense'}
    </button>
  );
}

export function ExpenseForm() {
  const expenseCategories = [
    'Rent',
    'Capital One',
    'Bilt',
    'Discover',
    'Gasoline',
    'Venmo',
    'Car',
  ];
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
  const [biltItems, setBiltItems] = useState([{ id: Date.now() }]);
  const [biltOtherDetails, setBiltOtherDetails] = useState<
    Record<number, boolean>
  >({});

  const addBiltItem = () => {
    setBiltItems((prev) => [...prev, { id: Date.now() }]);
  };

  const removeBiltItem = (id: number) => {
    if (biltItems.length > 1) {
      setBiltItems((prev) => prev.filter((item) => item.id !== id));
      setBiltOtherDetails((prev) => {
        const newDetails = { ...prev };
        delete newDetails[id];
        return newDetails;
      });
    }
  };

  const handleBiltDetailChange = (id: number, value: string) => {
    setBiltOtherDetails((prev) => ({
      ...prev,
      [id]: value === 'Others',
    }));
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <form
      action={createExpense}
      className="p-6 bg-white rounded-lg shadow-md space-y-4"
    >
      <div className="flex items-center gap-3">
        <Receipt className="h-7 w-7 text-blue-600" />
        <h2 className="text-2xl font-semibold text-gray-800">Add Expenses</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="month"
            className="block text-sm font-medium text-gray-700"
          >
            Month
          </label>
          <select
            id="month"
            name="month"
            required
            defaultValue={(new Date().getMonth() + 1).toString().padStart(2, '0')}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            htmlFor="year"
            className="block text-sm font-medium text-gray-700"
          >
            Year
          </label>
          <select
            id="year"
            name="year"
            required
            defaultValue={currentYear}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {expenseCategories.map((category) => (
        category === 'Bilt' ? (
          <div
            key={category}
            className="p-4 border border-gray-200 rounded-lg space-y-3"
          >
            <h3 className="text-lg font-medium text-gray-800">{category}</h3>
            <input
              type="hidden"
              name="bilt-item-count"
              value={biltItems.length}
            />
            {biltItems.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-start"
              >
                <div className="col-span-7">
                  <label htmlFor={`bilt-item-${index}`} className="sr-only">
                    Expense Item
                  </label>
                  <select
                    id={`bilt-item-${index}`}
                    name={`bilt-item-${index}`}
                    required
                    defaultValue=""
                    onChange={(e) =>
                      handleBiltDetailChange(item.id, e.target.value)
                    }
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>
                      Select an item
                    </option>
                    {biltExpenseDetails.map((detail) => (
                      <option key={detail} value={detail}>
                        {detail}
                      </option>
                    ))}
                  </select>
                  {biltOtherDetails[item.id] && (
                    <div className="mt-2">
                      <label
                        htmlFor={`bilt-other-detail-${index}`}
                        className="sr-only"
                      >
                        Other Detail
                      </label>
                      <input
                        type="text"
                        id={`bilt-other-detail-${index}`}
                        name={`bilt-other-detail-${index}`}
                        placeholder="Specify other detail"
                        required
                        className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  )}
                </div>
                <div className="col-span-4">
                  <label htmlFor={`bilt-price-${index}`} className="sr-only">
                    Price
                  </label>
                  <input
                    type="number"
                    id={`bilt-price-${index}`}
                    name={`bilt-price-${index}`}
                    step="0.01"
                    placeholder="0.00"
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="col-span-1 mt-1">
                  {biltItems.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeBiltItem(item.id)}
                      className="text-red-500 hover:text-red-700 font-bold text-xl"
                      aria-label="Remove item"
                    >
                      &times;
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addBiltItem}
              className="mt-2 w-full px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Add Bilt Item
            </button>
          </div>
        ) : (
          <div key={category}>
            <label
              htmlFor={category}
              className="block text-sm font-medium text-gray-700"
            >
              {category}
            </label>
            <input
              type="number"
              id={category}
              name={category}
              step="0.01"
              placeholder="0.00"
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )
      ))}

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
